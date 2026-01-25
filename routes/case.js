const express = require('express');
const router = express.Router();
const { Case, User } = require('../models');
const { Op } = require('sequelize');

// 3. Create/Link Case
// Note: Changed from /api/case/link to /link (mounted at /api/case)
router.post('/link', async (req, res) => {
    let { userId, caseNumber, role, summary } = req.body;
    userId = parseInt(userId, 10);

    try {
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
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4. Send Invite (Offender -> Victim)
router.post('/invite', async (req, res) => {
    const { caseNumber, victimPhone, senderName, customMessage } = req.body;

    try {
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
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4.5 Accept Connection (Victim accepts)
router.post('/accept', async (req, res) => {
    const { userId, caseNumber } = req.body;

    try {
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
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4.6 Create Private Room
router.post('/create-room', async (req, res) => {
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
router.get('/search', async (req, res) => {
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
router.post('/join-room', async (req, res) => {
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

// 6. Get Case Status (Match Info) - Returns ALL cases for user
router.get('/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json({ found: false, cases: [] });

    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return res.json({ found: false, cases: [] });

    try {
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

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 7. Apology System
router.post('/apology', async (req, res) => {
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

router.get('/apology', async (req, res) => {
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

module.exports = router;
