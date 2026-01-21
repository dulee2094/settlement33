const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '/'))); // Serve frontend files

// Database Setup (SQLite for simplicity)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// Models
const User = sequelize.define('User', {
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }, // In production, hash this!
    // role: { type: DataTypes.ENUM('offender', 'victim'), allowNull: false }, // Removed global role
    name: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING } // Added for matching invites
});

const Case = sequelize.define('Case', {
    caseNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, negotiating, settled
    offenderId: { type: DataTypes.INTEGER },
    victimId: { type: DataTypes.INTEGER },
    victimPhone: { type: DataTypes.STRING }, // Encrypted in real app
    inviteToken: { type: DataTypes.STRING },
    connectionStatus: { type: DataTypes.ENUM('none', 'invited', 'pending', 'connected'), defaultValue: 'none' },
    summary: { type: DataTypes.TEXT }, // Added brief case description
    roomTitle: { type: DataTypes.STRING }, // New: Private Room Title
    roomPassword: { type: DataTypes.STRING }, // New: Room Password
    creatorId: { type: DataTypes.INTEGER }, // New: Explicit Creator Tracking
    apologyContent: { type: DataTypes.TEXT }, // New: Apology Letter Content
    apologyStatus: { type: DataTypes.ENUM('none', 'sent', 'read'), defaultValue: 'none' }, // New: Apology Status
    proposalExtendOffender: { type: DataTypes.BOOLEAN, defaultValue: false },
    proposalExtendVictim: { type: DataTypes.BOOLEAN, defaultValue: false },
    // Midpoint Agreement (10% within)
    midpointProposed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Whether midpoint agreement is proposed
    midpointAmount: { type: DataTypes.INTEGER }, // The calculated midpoint amount
    midpointOffenderAgreed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Offender's agreement
    midpointVictimAgreed: { type: DataTypes.BOOLEAN, defaultValue: false } // Victim's agreement
});

const Proposal = sequelize.define('Proposal', {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    proposerId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    round: { type: DataTypes.INTEGER, defaultValue: 1 }, // Round number for matching proposals
    position: { type: DataTypes.STRING }, // 'payer' or 'receiver'
    message: { type: DataTypes.TEXT },
    duration: { type: DataTypes.INTEGER }, // 1, 3, 7 days
    expiresAt: { type: DataTypes.DATE }, // Calculated expiration time
    resultViewed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Whether user viewed the analysis result
    viewedAt: { type: DataTypes.DATE } // When the result was viewed
});

const Message = sequelize.define('Message', {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false }, // User ID
    content: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.STRING, defaultValue: 'text' } // text, image, system
});

const PaymentReq = sequelize.define('PaymentReq', {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    requesterId: { type: DataTypes.INTEGER, allowNull: false },
    bank: { type: DataTypes.STRING },
    accountNumber: { type: DataTypes.STRING },
    accountHolder: { type: DataTypes.STRING },
    amount: { type: DataTypes.INTEGER }, // Final amount
    signature: { type: DataTypes.TEXT }, // Base64
    status: { type: DataTypes.STRING, defaultValue: 'sent' } // sent, confirmed
});

// ... (Routes) ...

// 6. Proposal System
// Get Proposal Status (Blind)
app.get('/api/case/proposal', async (req, res) => {
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
                proposerId: { [Sequelize.Op.ne]: userId } // Not me
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

// Submit Proposal
app.post('/api/case/proposal', async (req, res) => {
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
app.post('/api/case/proposal/view-result', async (req, res) => {
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
                oppAmount: uid == c.offenderId ? pVictim.amount : pOffender.amount
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Extension Request
app.post('/api/case/proposal/extend', async (req, res) => {
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

// Routes

// Midpoint Agreement - Agree to Midpoint
app.post('/api/case/proposal/midpoint-agree', async (req, res) => {
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
app.get('/api/case/proposal/midpoint-status', async (req, res) => {
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



// 1. Sign Up
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, name, phoneNumber } = req.body;
        // Role is no longer stored on User
        const user = await User.create({ email, password, name, phoneNumber });

        // Check if there are any pending invites for this phone number
        if (phoneNumber) {
            const pendingCase = await Case.findOne({ where: { victimPhone: phoneNumber } });
            if (pendingCase && !pendingCase.victimId) {
                pendingCase.victimId = user.id;
                pendingCase.connectionStatus = 'pending'; // Waiting for explicit acceptance
                await pendingCase.save();
                console.log(`[Auto-Match] Matched User ${user.name} to Case ${pendingCase.caseNumber}`);
            }
        }

        res.json({ success: true, userId: user.id, name: user.name });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: 'User already exists or invalid data' });
    }
});

// 2. Login (Mock)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, password } });
    if (user) {
        res.json({ success: true, userId: user.id, name: user.name });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// 3. Create/Link Case
app.post('/api/case/link', async (req, res) => {
    let { userId, caseNumber, role, summary } = req.body;
    userId = parseInt(userId, 10);

    let caseData = await Case.findOne({ where: { caseNumber } });

    if (!caseData) {
        // Create new case if not exists
        const newCaseData = { caseNumber, summary };
        if (role === 'offender') {
            newCaseData.offenderId = userId;
        } else if (role === 'victim') {
            newCaseData.victimId = userId;
        }
        caseData = await Case.create(newCaseData);
    } else {
        // Link to existing case
        if (role === 'victim' && !caseData.victimId) {
            caseData.victimId = userId;
        } else if (role === 'offender' && !caseData.offenderId) {
            caseData.offenderId = userId;
        }

        // Update summary if it's currently empty
        if (summary && !caseData.summary) {
            caseData.summary = summary;
        }
        await caseData.save();
    }

    res.json({ success: true, caseId: caseData.id });
});

// 4. Send Invite (Offender -> Victim)
app.post('/api/case/invite', async (req, res) => {
    const { caseNumber, victimPhone, senderName, customMessage } = req.body;
    let caseData = await Case.findOne({ where: { caseNumber } });

    // Generate unique token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    if (caseData) {
        caseData.victimPhone = victimPhone;
        caseData.inviteToken = token;
        caseData.connectionStatus = 'invited';
        await caseData.save();
    }

    // Always send the mock SMS (whether linked to real case or not)
    const inviteLink = `https://SafeHappE.com/invite/${token}`;

    console.log(`[SMS MOCK] To: ${victimPhone}`);
    console.log(`[SMS MOCK] From: ${senderName || 'SafeHappE'}`);
    console.log(`[SMS MOCK] Message: Case "${caseNumber}" settlement requested.`);
    console.log(`[SMS MOCK] Link: ${inviteLink} (Unique Access)`);
    if (customMessage) console.log(`[SMS MOCK] Custom Msg: "${customMessage}"`);
    console.log(`[SMS MOCK] Note: ${caseData ? 'Linked to existing DB Case' : 'Arbitrary Case Name (Pre-filing)'}`);

    res.json({ success: true, message: 'Invitation sent' });
});

// 4.5 Accept Connection (Victim accepts)
app.post('/api/case/accept', async (req, res) => {
    const { userId, caseNumber } = req.body;

    const caseData = await Case.findOne({
        where: {
            caseNumber,
            victimId: userId
        }
    });

    if (caseData) {
        caseData.connectionStatus = 'connected';
        await caseData.save();
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, error: 'Case not found or permission denied' });
    }
});

// --- NEW: Private Room Features ---

// 4.6 Create Private Room
// 4.6 Create Private Room
app.post('/api/case/create-room', async (req, res) => {
    const { userId, role, roomTitle, roomPassword, summary } = req.body;
    const uid = parseInt(userId, 10);

    // Generate a unique case number (internal)
    const caseNumber = 'ROOM-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    try {
        const newCase = {
            caseNumber,
            roomTitle, // New Field
            roomPassword, // New Field
            summary,
            creatorId: uid, // Explicitly save creator
            status: 'pending',
            connectionStatus: 'pending'
        };

        if (role === 'offender') newCase.offenderId = uid;
        else if (role === 'victim') newCase.victimId = uid;

        const caseData = await Case.create(newCase);
        res.json({ success: true, caseId: caseData.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4.7 Search Rooms
app.get('/api/case/search', async (req, res) => {
    const { query, userId } = req.query;

    try {
        const whereClause = {
            // Only show rooms that are not full
            [Op.or]: [
                { offenderId: null },
                { victimId: null }
            ]
        };

        // Exclude my own rooms via creatorId if possible, or roles
        if (userId) {
            const uid = parseInt(userId);
            whereClause[Op.and] = [
                {
                    creatorId: { [Op.or]: [{ [Op.ne]: uid }, null] } // Check creatorId first
                },
                {
                    offenderId: { [Op.or]: [{ [Op.ne]: uid }, null] }
                },
                {
                    victimId: { [Op.or]: [{ [Op.ne]: uid }, null] }
                }
            ];
        }

        // If query exists, filter by title
        if (query) {
            whereClause.roomTitle = {
                [Op.like]: `%${query}%`
            };
        }

        let cases = await Case.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 20
        });

        // Double-check filtering
        if (userId) {
            const uid = parseInt(userId, 10);
            if (!isNaN(uid)) {
                cases = cases.filter(c =>
                    c.creatorId !== uid &&
                    c.offenderId !== uid &&
                    c.victimId !== uid
                );
            }
        }

        // Map to safe public info
        const result = await Promise.all(cases.map(async (c) => {
            let creatorName = '알 수 없음';
            // Prefer creatorId, fallback to role inference
            const creatorId = c.creatorId || c.offenderId || c.victimId;

            if (creatorId) {
                const user = await User.findByPk(creatorId);
                if (user) creatorName = user.name;
            }

            // Determine creator role for display
            let creatorRole = '미정';
            if (c.creatorId) {
                // If creatorId matches offenderId -> offender
                if (c.creatorId === c.offenderId) creatorRole = '피의자';
                else if (c.creatorId === c.victimId) creatorRole = '피해자';
            } else {
                // Fallback inference
                creatorRole = c.offenderId ? '피의자' : '피해자';
            }

            return {
                id: c.id,
                roomTitle: c.roomTitle,
                creatorRole: creatorRole,
                creatorName: creatorName,
                creatorId: creatorId,
                createdAt: c.createdAt
            };
        }));

        res.json({ success: true, rooms: result });
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: e.message });
    }
});

// 4.8 Join Room
app.post('/api/case/join-room', async (req, res) => {
    let { userId, caseId, password } = req.body;
    userId = parseInt(userId, 10);

    try {
        const caseData = await Case.findByPk(caseId);

        if (!caseData) return res.json({ success: false, error: '존재하지 않는 방입니다.' });
        if (caseData.roomPassword !== password) return res.json({ success: false, error: '비밀번호가 일치하지 않습니다.' });

        // Prevent Self-Join
        if (caseData.offenderId == userId || caseData.victimId == userId) {
            return res.json({ success: false, error: '본인이 개설하거나 이미 참여한 방입니다.' });
        }

        // Determine Role
        let myRole = '';
        if (caseData.offenderId && !caseData.victimId) {
            caseData.victimId = userId;
            myRole = 'victim';
        } else if (!caseData.offenderId && caseData.victimId) {
            caseData.offenderId = userId;
            myRole = 'offender';
        } else {
            return res.json({ success: false, error: '이미 정원이 가득 찬 방입니다.' });
        }

        caseData.connectionStatus = 'connected';
        await caseData.save();

        res.json({ success: true, role: myRole });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 5. Blind Proposal
app.post('/api/proposal', async (req, res) => {
    const { caseId, userId, amount } = req.body;
    await Proposal.create({ caseId, proposerId: userId, amount });

    // Check gap logic
    const proposals = await Proposal.findAll({ where: { caseId }, limit: 2, order: [['createdAt', 'DESC']] });

    let gapStatus = 'waiting';
    let gapData = {};

    if (proposals.length >= 2) {
        // Simplification: assumes last 2 are from diff users
        const p1 = proposals[0].amount;
        const p2 = proposals[1].amount;
        const diff = Math.abs(p1 - p2);

        gapStatus = 'analyzed';
        gapData = { diff };
    }

    res.json({ success: true, status: gapStatus, data: gapData });
});

// 5.5 Chat System (Real)
app.get('/api/case/chat', async (req, res) => {
    const { caseId } = req.query;
    try {
        const messages = await Message.findAll({
            where: { caseId },
            order: [['createdAt', 'ASC']]
        });

        // Enrich with sender info if needed, but for now ID is enough or client knows
        // Let's return formatted
        const result = messages.map(m => ({
            id: m.id,
            senderId: m.senderId,
            text: m.content,
            type: m.type, // 'text' or 'sent'/'received' will be determined by client comparing ID
            createdAt: m.createdAt
        }));

        res.json({ success: true, messages: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/case/chat', async (req, res) => {
    let { caseId, senderId, content } = req.body;
    senderId = parseInt(senderId, 10);
    try {
        await Message.create({ caseId, senderId, content });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 5.6 Payment Request System (Real)
app.post('/api/case/payment-request', async (req, res) => {
    let { caseId, requesterId, bank, accountNumber, accountHolder, amount, signature } = req.body;
    requesterId = parseInt(requesterId, 10);
    try {
        // Upsert (One request per case mostly, or just create new)
        // Let's replace previous if exists for this user/case or just create
        // Simple: Create new, client fetches latest
        await PaymentReq.create({
            caseId, requesterId, bank, accountNumber, accountHolder, amount, signature
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/case/payment-request', async (req, res) => {
    const { caseId } = req.query;
    try {
        const reqs = await PaymentReq.findAll({
            where: { caseId },
            order: [['createdAt', 'DESC']],
            limit: 1
        });

        if (reqs.length > 0) {
            res.json({ success: true, data: reqs[0] });
        } else {
            res.json({ success: true, data: null });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 6. Get Case Status (Match Info) - Returns ALL cases for user
app.get('/api/case/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json({ found: false, cases: [] });

    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return res.json({ found: false, cases: [] });

    // Find ALL cases where user is explicitly offender OR victim
    const cases = await Case.findAll({
        where: {
            [Op.or]: [
                { offenderId: uid },
                { victimId: uid }
            ]
        }
    });

    if (!cases || cases.length === 0) {
        return res.json({ found: false, cases: [] });
    }

    // Process each case
    const caseList = await Promise.all(cases.map(async (caseData) => {
        let counterpartyName = null;
        // Strict integer comparison for role determination
        const currentUserId = parseInt(userId, 10);
        const isOffender = (caseData.offenderId === currentUserId);
        const counterpartyId = isOffender ? caseData.victimId : caseData.offenderId;

        if (counterpartyId) {
            const counterparty = await User.findByPk(counterpartyId);
            if (counterparty) {
                counterpartyName = counterparty.name;
            }
        }

        return {
            caseId: caseData.id,
            caseNumber: caseData.caseNumber,
            roomTitle: caseData.roomTitle, // Added
            summary: caseData.summary, // Added
            myRole: isOffender ? 'offender' : 'victim',
            connectionStatus: caseData.connectionStatus || 'none',
            counterpartyName: counterpartyName || (isOffender ? '피해자 (가입 대기 중)' : '피의자 (가입 대기 중)'),
            status: caseData.status
        };
    }));

    res.json({
        found: true,
        cases: caseList
    });
});

// --- 8. Document Box (Digital Vault) ---

// Model
const Document = sequelize.define('Document', {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    uploaderId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false }, // apology, settlement, evidence, etc.
    fileName: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.STRING }, // mime type
    fileData: { type: DataTypes.TEXT('long'), allowNull: false } // Base64 storage for MVP
});

// Endpoint 8.1: Upload Document
app.post('/api/case/document', async (req, res) => {
    let { caseId, uploaderId, category, fileName, fileType, fileData } = req.body;
    uploaderId = parseInt(uploaderId, 10);
    try {
        await Document.create({
            caseId, uploaderId, category, fileName, fileType, fileData
        });
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint 8.2: List Documents (Metadata only)
app.get('/api/case/:caseId/documents', async (req, res) => {
    const { caseId } = req.params;
    try {
        const docs = await Document.findAll({
            where: { caseId },
            attributes: ['id', 'category', 'fileName', 'fileType', 'createdAt', 'uploaderId'], // Exclude heavy fileData
            order: [['createdAt', 'DESC']]
        });

        // Enrich with uploader name
        const result = await Promise.all(docs.map(async (d) => {
            const user = await User.findByPk(d.uploaderId);
            return {
                id: d.id,
                category: d.category,
                fileName: d.fileName,
                fileType: d.fileType,
                createdAt: d.createdAt,
                uploaderName: user ? user.name : '알 수 없음',
                isMine: false // To be handled by client using userId comparison
            };
        }));

        res.json({ success: true, documents: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint 8.3: Download Document
app.get('/api/document/:docId', async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.docId);
        if (!doc) return res.status(404).send('File not found');

        res.json({
            success: true,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileData: doc.fileData
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- 7. Lawyer Consultation System (New) ---

// Model
const Consultation = sequelize.define('Consultation', {
    name: { type: DataTypes.STRING, allowNull: false }, // 신청인 이름 (추가됨)
    summary: { type: DataTypes.TEXT, allowNull: false }, // 사건 요지
    details: { type: DataTypes.TEXT, allowNull: false }, // 상담 상세 내용
    phoneNumber: { type: DataTypes.STRING, allowNull: false }, // 연락처
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, completed
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Endpoint 1: Submit Consultation
app.post('/api/consultation', async (req, res) => {
    const { name, summary, details, phoneNumber } = req.body;
    try {
        await Consultation.create({ name, summary, details, phoneNumber });
        console.log(`[Consultation] New request from ${name} (${phoneNumber})`);
        // Future: Send Email Notification here
        res.json({ success: true, message: '상담 신청이 완료되었습니다.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
});

// Endpoint 2: Admin - Get All Consultations
app.get('/api/admin/consultations', async (req, res) => {
    // In a real app, check for Admin Session/Token here!
    // For now, we will use a simple query param password for safety demo
    const { adminKey } = req.query;
    if (adminKey !== 'admin1234') { // Simple hardcoded key for mvp
        return res.status(403).json({ success: false, error: '관리자 권한이 없습니다.' });
    }

    try {
        const list = await Consultation.findAll({ order: [['submittedAt', 'DESC']] });
        res.json({ success: true, list });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});


// 7. Apology System
app.post('/api/case/apology', async (req, res) => {
    const { caseId, content } = req.body;
    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.status(404).json({ success: false, error: 'Case not found' });
        c.apologyContent = content;
        c.apologyStatus = 'sent';
        await c.save();
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/case/apology', async (req, res) => {
    const { caseId } = req.query;
    try {
        const c = await Case.findByPk(caseId);
        if (!c) return res.status(404).json({ success: false, error: 'Case not found' });
        res.json({
            success: true,
            status: c.apologyStatus,
            content: c.apologyContent,
            date: c.updatedAt
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Initialize & Start
sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

