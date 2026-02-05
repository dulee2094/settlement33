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

module.exports = router;
