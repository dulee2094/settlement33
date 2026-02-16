// ... (existing imports)
const { Proposal, Case, User } = require('../models'); // ensuring User is imported


const { Op } = require('sequelize');

const ProposalController = {
    // 1. Get Proposal Status (Blind)
    // 원래 router.get('/')에 해당
    async getStatus(req, res) {
        const { userId, caseId } = req.query;
        const uid = parseInt(userId, 10);
        try {
            // Get my proposals
            const myProposals = await Proposal.findAll({
                where: { caseId, proposerId: uid },
                order: [['createdAt', 'DESC']]
            });

            // Check if opponent has proposed (Blind)
            const opponentProposals = await Proposal.findAll({
                where: {
                    caseId,
                    proposerId: { [Op.ne]: uid } // Not me
                },
                order: [['createdAt', 'DESC']]
            });

            // Check Case Extension Status
            const c = await Case.findByPk(caseId);
            if (!c) {
                return res.json({ success: false, error: 'Case not found' });
            }
            const isExtended = c.proposalExtendOffender && c.proposalExtendVictim;

            // Get Case Title & Opponent Name
            let caseTitle = c.roomTitle || c.caseNumber;
            let opponentName = '-';

            if (c.victimId && c.offenderId) {
                const opponent = await User.findByPk((uid === c.offenderId) ? c.victimId : c.offenderId);
                if (opponent) opponentName = opponent.name || opponent.username;
            }

            // Check if I agreed to extension
            let iAgreed = false;
            let oppAgreed = false;
            let myNextRoundIntent = false;
            let oppNextRoundIntent = false;

            if (c) {
                if (c.offenderId === uid) {
                    iAgreed = c.proposalExtendOffender;
                    oppAgreed = c.proposalExtendVictim;
                    myNextRoundIntent = c.nextRoundIntentOffender;
                    oppNextRoundIntent = c.nextRoundIntentVictim;
                } else if (c.victimId === uid) {
                    iAgreed = c.proposalExtendVictim;
                    oppAgreed = c.proposalExtendOffender;
                    myNextRoundIntent = c.nextRoundIntentVictim;
                    oppNextRoundIntent = c.nextRoundIntentOffender;
                }
            }

            // Calculate current round
            const myRound = myProposals.length > 0 ? myProposals[0].round : 0;
            const oppRound = opponentProposals.length > 0 ? opponentProposals[0].round : 0;
            let currentRound = Math.max(myRound, oppRound);

            // Logic to advance round if both agreed
            // If both sides finished the previous round (equal rounds) and signaled intent:
            if (c.nextRoundIntentOffender && c.nextRoundIntentVictim) {
                if (myRound === oppRound && myRound === currentRound) {
                    currentRound++;
                }
            }

            // Check Gap Analysis for CURRENT round
            const allProposals = await Proposal.findAll({
                where: { caseId },
                order: [['createdAt', 'DESC']]
            });

            let gapStatus = 'waiting';
            let gapData = {};
            let currentRoundData = null;
            let roundStatus = 'waiting';

            // Find proposals for current round
            const pOffenderCurrent = allProposals.find(p =>
                p.proposerId == c.offenderId && p.round == currentRound
            );
            const pVictimCurrent = allProposals.find(p =>
                p.proposerId == c.victimId && p.round == currentRound
            );

            // Other user's proposal and my proposal
            const myProposal = allProposals.find(p => p.proposerId == uid && p.round == currentRound);
            const oppProposal = allProposals.find(p => p.proposerId != uid && p.round == currentRound);

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

                // Midpoint Check
                const maxVal = Math.max(amt1, amt2);
                const gapPercent = (diff / maxVal) * 100;
                if (gapPercent <= 10) {
                    // Midpoint Active!
                    midpointStatus = {
                        isMidpointActive: true,
                        gapPercent: gapPercent,
                        midpointAmount: Math.floor((amt1 + amt2) / 2) // Integer midpoint
                    };
                }
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
                        completed: true,
                        resultViewed: pOff.resultViewed && pVic.resultViewed
                    });
                } else {
                    previousRounds.push({
                        round: r,
                        completed: false,
                        expired: true
                    });
                }
            }

            res.json({
                success: true,
                myProposalCount: myProposals.length,
                myLastProposal: myProposals.length > 0 ? myProposals[0] : null,
                opponentProposalCount: opponentProposals.length,
                hasOpponentProposed: oppRound === currentRound,
                opponentLastProposal: opponentProposals.length > 0 ? {
                    expiresAt: opponentProposals[0].expiresAt,
                    createdAt: opponentProposals[0].createdAt
                } : null,
                currentRound: currentRound,
                myRound: myRound,
                oppRound: oppRound,
                roundStatus: roundStatus,
                myResultViewed: myProposal?.resultViewed || false,
                oppResultViewed: oppProposal?.resultViewed || false,
                isExtended,
                iAgreed,
                oppAgreed,
                myNextRoundIntent,
                oppNextRoundIntent,
                caseTitle,
                opponentName,
                status: gapStatus,
                data: gapData,
                currentRoundData: currentRoundData,
                previousRounds: previousRounds,
                midpointStatus: midpointStatus // Include in response
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // 2. Submit Proposal
    // 원래 router.post('/')에 해당
    async submitProposal(req, res) {
        let { userId, caseId, amount, duration, position } = req.body;
        userId = parseInt(userId, 10);

        try {
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });

            const isExtended = c.proposalExtendOffender && c.proposalExtendVictim;
            const limit = isExtended ? 8 : 5;

            const count = await Proposal.count({ where: { caseId, proposerId: userId } });
            if (count >= limit) {
                return res.json({ success: false, error: `제안 횟수(${limit}회)를 모두 소진했습니다.` });
            }

            const myProposals = await Proposal.findAll({
                where: { caseId, proposerId: userId },
                order: [['createdAt', 'DESC']]
            });
            const currentRound = myProposals.length > 0 ? myProposals[0].round + 1 : 1;

            const oppProposal = await Proposal.findOne({
                where: { caseId, proposerId: { [Op.ne]: userId }, round: currentRound }
            });

            if (oppProposal) {
                if (oppProposal.expiresAt && new Date(oppProposal.expiresAt) < new Date()) {
                    return res.json({ success: false, error: '상대방의 제안 유효기간이 만료되었습니다. 페이지를 새로고침하여 다음 라운드를 진행해주세요.' });
                }
            }

            // Convergence Principle Check
            const myPrevProposals = await Proposal.findAll({
                where: { caseId, proposerId: userId },
                order: [['createdAt', 'DESC']],
                limit: 1
            });

            if (myPrevProposals.length > 0) {
                const lastAmount = myPrevProposals[0].amount;
                if (userId === c.offenderId) {
                    if (amount < lastAmount) return res.json({ success: false, error: `합의 수렴 원칙 위배: 이전 제안(${lastAmount.toLocaleString()}원)보다 낮은 금액을 제안할 수 없습니다.` });
                } else if (userId === c.victimId) {
                    if (amount > lastAmount) return res.json({ success: false, error: `합의 수렴 원칙 위배: 이전 제안(${lastAmount.toLocaleString()}원)보다 높은 금액을 제안할 수 없습니다.` });
                }
            }

            const expiresAt = new Date();
            if (duration === 0.25) expiresAt.setHours(expiresAt.getHours() + 6);
            else expiresAt.setDate(expiresAt.getDate() + duration);

            await Proposal.create({
                caseId,
                proposerId: userId,
                amount,
                round: currentRound,
                position: position || 'payer',
                duration,
                expiresAt
            });

            if (c.status === 'connected') {
                c.status = 'negotiating';
            }
            if (userId === c.offenderId) c.nextRoundIntentOffender = false;
            else if (userId === c.victimId) c.nextRoundIntentVictim = false;
            await c.save();

            // Gap Analysis
            const proposals = await Proposal.findAll({ where: { caseId }, order: [['createdAt', 'DESC']] });
            let gapStatus = 'waiting';
            let gapData = {};
            let midpointTriggered = false;

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
                    // Midpoint Logic: Amount is saved but not revealed until agreement
                    const mid = Math.floor((amt1 + amt2) / 2);
                    c.midpointProposed = true;
                    c.midpointAmount = mid;
                    await c.save();
                }
            }

            res.json({
                success: true,
                leftCount: limit - count - 1,
                status: gapStatus,
                data: gapData,
                currentRound,
                midpointTriggered,
                midpointAmount: null,
                myLastProposal: { amount, position, round: currentRound }
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // 3. View Analysis Result
    // 원래 router.post('/view-result')
    async viewAnalysisResult(req, res) {
        const { userId, caseId, round } = req.body;
        try {
            const uid = parseInt(userId);
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });

            const proposals = await Proposal.findAll({ where: { caseId, round }, order: [['createdAt', 'ASC']] });
            if (proposals.length < 2) return res.json({ success: false, error: 'Both proposals not found for this round' });

            const myProposal = proposals.find(p => p.proposerId === uid);
            const oppProposal = proposals.find(p => p.proposerId !== uid);

            if (!myProposal || !oppProposal) return res.json({ success: false, error: 'Proposal data incomplete' });

            if (!myProposal.resultViewed) {
                myProposal.resultViewed = true;
                await myProposal.save();
            }

            const bothViewed = myProposal.resultViewed && oppProposal.resultViewed;
            if (!bothViewed) {
                return res.json({ success: true, bothViewed: false, message: 'Waiting for opponent to view results' });
            }

            const myAmount = myProposal.amount;
            const oppAmount = oppProposal.amount;
            const diff = Math.abs(myAmount - oppAmount);
            const diffPercent = (diff / Math.max(myAmount, oppAmount)) * 100;
            const midpointPossible = diffPercent <= 10;
            const midpointResolved = c.midpointRejected || c.status === 'settled';

            res.json({
                success: true,
                bothViewed: true,
                analysis: {
                    myAmount,
                    oppAmount,
                    diff,
                    diffPercent,
                    midpointPossible,
                    midpointResolved
                }
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // 4. Expire Sync
    async expireSync(req, res) {
        const { userId, caseId, round } = req.body;
        try {
            const uid = parseInt(userId);
            const existing = await Proposal.findOne({ where: { caseId, proposerId: uid, round } });
            if (existing) return res.json({ success: true, message: 'Already synced' });

            await Proposal.create({
                caseId,
                proposerId: uid,
                amount: 0,
                round,
                position: 'expired_sync',
                duration: 0,
                expiresAt: new Date(),
                resultViewed: true,
                message: 'Round Skipped (Timeout)'
            });

            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // 5. Extend Request
    async extendRequest(req, res) {
        const { caseId, userId } = req.body;
        try {
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });
            const uid = parseInt(userId);

            if (c.offenderId === uid) c.proposalExtendOffender = true;
            else if (c.victimId === uid) c.proposalExtendVictim = true;
            else return res.json({ success: false, error: 'Not a participant' });

            await c.save();
            const isExtended = c.proposalExtendOffender && c.proposalExtendVictim;
            res.json({ success: true, isExtended });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // 6. Midpoint Status
    async getMidpointStatus(req, res) {
        const { caseId, userId } = req.query;
        try {
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });
            const uid = parseInt(userId);

            let phase = 0;
            let iProcedureAgreed = false;
            let oppProcedureAgreed = false;
            let iFinalAgreed = false;
            let oppFinalAgreed = false;

            if (c.offenderId === uid) {
                iProcedureAgreed = c.midpointProcedureOffenderAgreed;
                oppProcedureAgreed = c.midpointProcedureVictimAgreed;
                iFinalAgreed = c.midpointOffenderAgreed;
                oppFinalAgreed = c.midpointVictimAgreed;
            } else if (c.victimId === uid) {
                iProcedureAgreed = c.midpointProcedureVictimAgreed;
                oppProcedureAgreed = c.midpointProcedureOffenderAgreed;
                iFinalAgreed = c.midpointVictimAgreed;
                oppFinalAgreed = c.midpointOffenderAgreed;
            }

            const bothProcedureAgreed = c.midpointProcedureOffenderAgreed && c.midpointProcedureVictimAgreed;
            const bothFinalAgreed = c.midpointOffenderAgreed && c.midpointVictimAgreed;

            if (bothFinalAgreed) phase = 3;
            else if (bothProcedureAgreed || c.midpointAmountRevealed) phase = 2;
            else if (c.midpointProposed) phase = 1;

            res.json({
                success: true,
                midpointProposed: c.midpointProposed,
                phase,
                procedureAgreement: { iAgreed: iProcedureAgreed, oppAgreed: oppProcedureAgreed, bothAgreed: bothProcedureAgreed },
                finalAgreement: { iAgreed: iFinalAgreed, oppAgreed: oppFinalAgreed, bothAgreed: bothFinalAgreed },
                midpointAmount: c.midpointAmountRevealed ? c.midpointAmount : null,
                rejected: c.midpointRejected,
                rejectedBy: c.midpointRejectedBy
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    // 7. Midpoint Steps (Agreement)
    async midpointProcedureAgree(req, res) {
        const { userId, caseId, agreed } = req.body;
        try {
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });
            const uid = parseInt(userId);

            if (!agreed) {
                c.midpointRejected = true;
                c.midpointRejectedBy = uid === c.offenderId ? 'offender' : 'victim';
                c.midpointRejectedAt = new Date();
                await c.save();
                return res.json({ success: true, rejected: true });
            }

            if (c.offenderId === uid) c.midpointProcedureOffenderAgreed = true;
            else if (c.victimId === uid) c.midpointProcedureVictimAgreed = true;
            await c.save();

            const bothAgreedProcedure = c.midpointProcedureOffenderAgreed && c.midpointProcedureVictimAgreed;
            if (bothAgreedProcedure) {
                c.midpointAmountRevealed = true;
                await c.save();
                return res.json({ success: true, bothAgreedProcedure: true, midpointAmount: c.midpointAmount, phase: 2 });
            }

            res.json({ success: true, waiting: true, phase: 1 });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    async midpointFinalAgree(req, res) {
        const { userId, caseId, agreed } = req.body;
        try {
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });
            const uid = parseInt(userId);

            if (!c.midpointProcedureOffenderAgreed || !c.midpointProcedureVictimAgreed) {
                return res.json({ success: false, error: 'Procedure not agreed by both parties' });
            }

            if (!agreed) {
                c.midpointRejected = true;
                c.midpointRejectedBy = uid === c.offenderId ? 'offender' : 'victim';
                c.midpointRejectedAt = new Date();
                await c.save();
                return res.json({ success: true, rejected: true });
            }

            if (c.offenderId === uid) c.midpointOffenderAgreed = true;
            else if (c.victimId === uid) c.midpointVictimAgreed = true;
            await c.save();

            const bothAgreedFinal = c.midpointOffenderAgreed && c.midpointVictimAgreed;
            if (bothAgreedFinal) {
                c.status = 'settled';
                c.finalAmount = c.midpointAmount;
                await c.save();
                return res.json({ success: true, settled: true, finalAmount: c.midpointAmount });
            }

            res.json({ success: true, waiting: true, phase: 2 });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    },

    async nextRoundIntent(req, res) {
        const { userId, caseId, round } = req.body;
        try {
            const c = await Case.findByPk(caseId);
            if (!c) return res.json({ success: false, error: 'Case not found' });
            const uid = parseInt(userId);

            if (c.offenderId === uid) c.nextRoundIntentOffender = true;
            else if (c.victimId === uid) c.nextRoundIntentVictim = true;
            else return res.json({ success: false, error: 'Not a participant' });

            await c.save();

            const bothReady = c.nextRoundIntentOffender && c.nextRoundIntentVictim;
            // logic: if both ready, clients should reload and see new round input?
            // Actually, client logic just waits for `nextRoundStarted` or both intents.

            res.json({
                success: true,
                myNextRoundIntent: true, // echo back
                nextRoundStarted: bothReady
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, error: e.message });
        }
    }
};

module.exports = ProposalController;
