const express = require('express');
const router = express.Router();
const { Proposal, Case } = require('../models');
const { Op, Sequelize } = require('sequelize');

// NOTE: This router is mounted at /api/case/proposal mostly, but legacy /api/proposal exists too.
// We will separate them in server.js mounting, but define them here.
// For simplicity, we will assume this router handles /api/case/proposal/*
// And we export a separate router or function for /api/proposal if needed, or just handle all here.
// Actually, let's keep all proposal logic here.

// 6. Proposal System
// Get Proposal Status (Blind)
router.get('/', async (req, res) => {
    const { userId, caseId } = req.query;
    try {
        // Get my proposals
        const myProposals = await Proposal.findAll({
            where: { caseId, proposerId: userId },
            order: [['createdAt', 'DESC']]
        });

        // Check if opponent has proposed (Blind)
        const opponentProposals = await Proposal.findAll({
            where: {
                caseId,
                proposerId: { [Op.ne]: userId } // Not me
            },
            order: [['createdAt', 'DESC']]
        });

        // Check Case Extension Status
        const c = await Case.findByPk(caseId);
        const isExtended = c && c.proposalExtendOffender && c.proposalExtendVictim;
        // Check if I agreed
        const myUid = parseInt(userId);
        let iAgreed = false;
        let oppAgreed = false;
        if (c) {
            if (c.offenderId === myUid) {
                iAgreed = c.proposalExtendOffender;
                oppAgreed = c.proposalExtendVictim;
            } else if (c.victimId === myUid) {
                iAgreed = c.proposalExtendVictim;
                oppAgreed = c.proposalExtendOffender;
            }
        }

        // Calculate current round
        const myRound = myProposals.length > 0 ? myProposals[0].round : 0;
        const oppRound = opponentProposals.length > 0 ? opponentProposals[0].round : 0;
        const currentRound = Math.max(myRound, oppRound);

        // Check Gap Analysis for CURRENT round
        const allProposals = await Proposal.findAll({
            where: { caseId },
            order: [['createdAt', 'DESC']]
        });

        let gapStatus = 'waiting';
        let gapData = {};
        let currentRoundData = null;
        let roundStatus = 'waiting'; // 'waiting', 'proposing', 'ready', 'completed'

        // Find proposals for current round
        const pOffenderCurrent = allProposals.find(p =>
            p.proposerId == c.offenderId && p.round == currentRound
        );
        const pVictimCurrent = allProposals.find(p =>
            p.proposerId == c.victimId && p.round == currentRound
        );

        // Determine my proposal and opponent's proposal
        const myProposal = allProposals.find(p =>
            p.proposerId == myUid && p.round == currentRound
        );
        const oppProposal = allProposals.find(p =>
            p.proposerId != myUid && p.round == currentRound
        );

        if (pOffenderCurrent && pVictimCurrent) {
            const amt1 = pOffenderCurrent.amount;
            const amt2 = pVictimCurrent.amount;
            const diff = Math.abs(amt1 - amt2);

            // Check if both viewed results
            const bothViewed = pOffenderCurrent.resultViewed && pVictimCurrent.resultViewed;

            if (bothViewed) {
                gapStatus = 'analyzed';
                roundStatus = 'completed';
            } else {
                gapStatus = 'ready'; // Both proposed, waiting for view
                roundStatus = 'ready';
            }

            gapData = { diff, round: currentRound };
            currentRoundData = {
                round: currentRound,
                offenderAmount: amt1,
                victimAmount: amt2,
                diff: diff,
                completed: true,
                bothViewed: bothViewed
            };
        } else if (pOffenderCurrent || pVictimCurrent) {
            roundStatus = 'proposing'; // One side proposed

            // Check for expiration
            const now = new Date();
            const activeProp = pOffenderCurrent || pVictimCurrent;
            if (activeProp && activeProp.expiresAt && new Date(activeProp.expiresAt) < now) {
                gapStatus = 'expired';
                roundStatus = 'expired';
            }
        }

        // Get previous rounds history
        const previousRounds = [];
        for (let r = 1; r < currentRound; r++) {
            const pOff = allProposals.find(p => p.proposerId == c.offenderId && p.round == r);
            const pVic = allProposals.find(p => p.proposerId == c.victimId && p.round == r);

            if (pOff && pVic) {
                previousRounds.push({
                    round: r,
                    offenderAmount: pOff.amount,
                    victimAmount: pVic.amount,
                    diff: Math.abs(pOff.amount - pVic.amount),
                    completed: true
                });
            } else {
                previousRounds.push({
                    round: r,
                    completed: false,
                    expired: true // Timeout assumed
                });
            }
        }

        res.json({
            success: true,
            myProposalCount: myProposals.length,
            myLastProposal: myProposals.length > 0 ? myProposals[0] : null,
            opponentProposalCount: opponentProposals.length,
            hasOpponentProposed: opponentProposals.length > 0,
            opponentLastProposal: opponentProposals.length > 0 ? {
                expiresAt: opponentProposals[0].expiresAt,
                createdAt: opponentProposals[0].createdAt
            } : null,
            currentRound: currentRound,
            myRound: myRound,
            oppRound: oppRound,
            roundStatus: roundStatus, // NEW: 'waiting', 'proposing', 'ready', 'completed'
            myResultViewed: myProposal?.resultViewed || false, // NEW
            oppResultViewed: oppProposal?.resultViewed || false, // NEW
            isExtended,
            iAgreed,
            oppAgreed,
            status: gapStatus,
            data: gapData,
            currentRoundData: currentRoundData,
            previousRounds: previousRounds
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Expire Sync Route (Extracted)
router.post('/expire-sync', async (req, res) => {
    const { userId, caseId, round } = req.body;
    // Insert a dummy proposal to catch up
    try {
        const uid = parseInt(userId);

        // Double check if already proposed
        const existing = await Proposal.findOne({ where: { caseId, proposerId: uid, round } });
        if (existing) return res.json({ success: true, message: 'Already synced' });

        await Proposal.create({
            caseId,
            proposerId: uid,
            amount: 0, // Dummy
            round,
            position: 'expired_sync',
            duration: 0,
            expiresAt: new Date(), // Already expired
            resultViewed: true, // Auto-view
            message: 'Round Skipped (Timeout)'
        });

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Submit Proposal
router.post('/', async (req, res) => {
    let { userId, caseId, amount, duration, position } = req.body;
    userId = parseInt(userId, 10); // Ensure Integer

    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.json({ success: false, error: 'Case not found' });

        // Check Extension Logic
        const isExtended = c.proposalExtendOffender && c.proposalExtendVictim;
        const limit = isExtended ? 8 : 5; // Base 5, Extended 8 (+3)

        // Check Limit
        const count = await Proposal.count({ where: { caseId, proposerId: userId } });

        if (count >= limit) {
            return res.json({ success: false, error: `제안 횟수(${limit}회)를 모두 소진했습니다.` });
        }

        // Calculate current round for this user
        const myProposals = await Proposal.findAll({
            where: { caseId, proposerId: userId },
            order: [['createdAt', 'DESC']]
        });


        const currentRound = myProposals.length > 0 ? myProposals[0].round + 1 : 1;

        // Check if opponent has a pending proposal for this round that is EXPIRED
        const oppProposal = await Proposal.findOne({
            where: { caseId, proposerId: { [Op.ne]: userId }, round: currentRound }
        });

        if (oppProposal) {
            if (oppProposal.expiresAt && new Date(oppProposal.expiresAt) < new Date()) {
                // Opponent's proposal expired. Cannot match.
                return res.json({ success: false, error: '상대방의 제안 유효기간이 만료되었습니다. 페이지를 새로고침하여 다음 라운드를 진행해주세요.' });
            }
        }

        // --- CONVERGENCE PRINCIPLE CHECK ---
        const myPrevProposals = await Proposal.findAll({
            where: { caseId, proposerId: userId },
            order: [['createdAt', 'DESC']],
            limit: 1
        });

        if (myPrevProposals.length > 0) {
            const lastAmount = myPrevProposals[0].amount;

            // Check Role
            if (userId === c.offenderId) {
                // Offender: Should INCREASE or STAY (Cannot propose less than before)
                if (amount < lastAmount) {
                    return res.json({ success: false, error: `합의 수렴 원칙 위배: 이전 제안(${lastAmount.toLocaleString()}원)보다 낮은 금액을 제안할 수 없습니다.` });
                }
            } else if (userId === c.victimId) {
                // Victim: Should DECREASE or STAY (Cannot propose more than before)
                if (amount > lastAmount) {
                    return res.json({ success: false, error: `합의 수렴 원칙 위배: 이전 제안(${lastAmount.toLocaleString()}원)보다 높은 금액을 제안할 수 없습니다.` });
                }
            }
        }
        // -----------------------------------

        // Calculate expiration time
        const expiresAt = new Date();
        if (duration === 0.25) {
            expiresAt.setHours(expiresAt.getHours() + 6);
        } else {
            expiresAt.setDate(expiresAt.getDate() + duration);
        }

        await Proposal.create({
            caseId,
            proposerId: userId,
            amount,
            round: currentRound,
            position: position || 'payer',
            duration,
            expiresAt
        });

        // Update case status to negotiating if not already
        if (c.status === 'connected') {
            c.status = 'negotiating';
            await c.save();
        }

        // --- GAP ANALYSIS (Round-Based) ---
        const proposals = await Proposal.findAll({
            where: { caseId },
            order: [['createdAt', 'DESC']]
        });

        let gapStatus = 'waiting';
        let gapData = {};
        let midpointTriggered = false;
        let midpointAmount = 0;

        // Find proposals for CURRENT round only
        const pOffender = proposals.find(p => p.proposerId == c.offenderId && p.round == currentRound);
        const pVictim = proposals.find(p => p.proposerId == c.victimId && p.round == currentRound);

        if (pOffender && pVictim) {
            const amt1 = pOffender.amount;
            const amt2 = pVictim.amount;
            const diff = Math.abs(amt1 - amt2);

            gapStatus = 'analyzed';
            gapData = { diff, round: currentRound };

            const maxVal = Math.max(amt1, amt2);
            if (diff <= (maxVal * 0.1)) {
                midpointTriggered = true;
                midpointAmount = Math.floor((amt1 + amt2) / 2);
                c.midpointProposed = true;
                c.midpointAmount = midpointAmount;
                await c.save();
            }
        }

        res.json({
            success: true,
            leftCount: limit - count - 1,
            status: gapStatus,
            data: gapData,
            currentRound: currentRound,
            midpointTriggered,
            midpointAmount: null, // BLIND LOGIC: Don't show amount until agreed
            myLastProposal: { amount, position, round: currentRound }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// View Analysis Result (NEW - Phase 1)
router.post('/view-result', async (req, res) => {
    const { userId, caseId, round } = req.body;

    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.json({ success: false, error: 'Case not found' });

        const uid = parseInt(userId);

        // Find my proposal for this round
        const myProposal = await Proposal.findOne({
            where: { caseId, proposerId: uid, round }
        });

        if (!myProposal) {
            return res.json({ success: false, error: 'Proposal not found' });
        }

        // Mark as viewed
        myProposal.resultViewed = true;
        myProposal.viewedAt = new Date();
        await myProposal.save();

        // Get both proposals for this round
        const proposals = await Proposal.findAll({
            where: { caseId, round }
        });

        const pOffender = proposals.find(p => p.proposerId == c.offenderId);
        const pVictim = proposals.find(p => p.proposerId == c.victimId);

        if (!pOffender || !pVictim) {
            return res.json({ success: false, error: 'Both proposals not found' });
        }

        // Check if both viewed
        const bothViewed = pOffender.resultViewed && pVictim.resultViewed;

        // Calculate analysis
        const diff = Math.abs(pOffender.amount - pVictim.amount);
        const maxAmount = Math.max(pOffender.amount, pVictim.amount);
        const diffPercent = (diff / maxAmount * 100).toFixed(2);

        // Midpoint Logic Check
        let midpointPossible = false;
        if (diff <= (maxAmount * 0.1001)) {
            midpointPossible = true;
            // Save the calculated midpoint amount
            const mid = Math.floor((pOffender.amount + pVictim.amount) / 2);
            c.midpointAmount = mid;
            c.midpointProposed = true;
            await c.save();
        }

        res.json({
            success: true,
            bothViewed,
            analysis: {
                round,
                offenderAmount: pOffender.amount,
                victimAmount: pVictim.amount,
                diff,
                diffPercent,
                myAmount: myProposal.amount,
                oppAmount: uid == c.offenderId ? pVictim.amount : pOffender.amount,
                midpointPossible,
                midpointResolved: c.midpointRejected
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Midpoint Agreement Endpoint
router.post('/midpoint-agreement', async (req, res) => {
    const { userId, caseId, agreed } = req.body;
    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.json({ success: false, error: 'Case not found' });

        const uid = parseInt(userId);

        if (!agreed) {
            c.midpointRejected = true;
            await c.save();
            return res.json({ success: true, rejected: true });
        }

        if (c.offenderId === uid) c.midpointOffenderAgreed = true;
        else if (c.victimId === uid) c.midpointVictimAgreed = true;

        await c.save();

        if (c.midpointOffenderAgreed && c.midpointVictimAgreed) {
            c.status = 'settled_midpoint';
            c.finalAmount = c.midpointAmount;
            await c.save();
            return res.json({ success: true, settled: true, finalAmount: c.midpointAmount });
        }

        res.json({ success: true, waiting: true });

    } catch (e) {
        console.error(e); res.json({ success: false, error: e.message });
    }
});

// Extension Request
router.post('/extend', async (req, res) => {
    const { caseId, userId } = req.body;
    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.json({ success: false, error: 'Case not found' });

        const uid = parseInt(userId);

        if (c.offenderId === uid) {
            c.proposalExtendOffender = true;
        } else if (c.victimId === uid) {
            c.proposalExtendVictim = true;
        } else {
            return res.json({ success: false, error: 'Not a participant' });
        }
        await c.save();

        const isExtended = c.proposalExtendOffender && c.proposalExtendVictim;
        res.json({ success: true, isExtended });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Midpoint Agreement - Agree to Midpoint (Legacy/Duplicate?)
router.post('/midpoint-agree', async (req, res) => {
    const { caseId, userId } = req.body;
    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.json({ success: false, error: 'Case not found' });

        const uid = parseInt(userId);

        // Set agreement flag
        if (c.offenderId === uid) {
            c.midpointOffenderAgreed = true;
        } else if (c.victimId === uid) {
            c.midpointVictimAgreed = true;
        } else {
            return res.json({ success: false, error: 'Not a participant' });
        }

        await c.save();

        // Check if both agreed
        const bothAgreed = c.midpointOffenderAgreed && c.midpointVictimAgreed;

        // If both agreed, update case status to settled
        if (bothAgreed) {
            c.status = 'settled';
            await c.save();
        }

        res.json({
            success: true,
            bothAgreed,
            midpointAmount: c.midpointAmount
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Midpoint Agreement - Get Status
router.get('/midpoint-status', async (req, res) => {
    const { caseId, userId } = req.query;
    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.json({ success: false, error: 'Case not found' });

        const uid = parseInt(userId);
        let iAgreed = false;
        let oppAgreed = false;

        if (c.offenderId === uid) {
            iAgreed = c.midpointOffenderAgreed;
            oppAgreed = c.midpointVictimAgreed;
        } else if (c.victimId === uid) {
            iAgreed = c.midpointVictimAgreed;
            oppAgreed = c.midpointOffenderAgreed;
        }

        const bothAgreed = c.midpointOffenderAgreed && c.midpointVictimAgreed;

        res.json({
            success: true,
            midpointProposed: c.midpointProposed,
            midpointAmount: bothAgreed ? c.midpointAmount : null, // BLIND LOGIC: Hide until agreement
            iAgreed,
            oppAgreed,
            bothAgreed
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
