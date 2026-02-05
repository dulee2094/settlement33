const express = require('express');
const router = express.Router();
const { Case, User } = require('../models');
const { Op } = require('sequelize');

// ============================================
// 🏠 Room Management Routes
// ============================================

// Create Private Room
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

// Search Rooms
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

// Join Room
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

module.exports = router;
