const express = require('express');
const router = express.Router();
const { Message } = require('../models');

// 5.5 Chat System (Real)
router.get('/', async (req, res) => {
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

router.post('/', async (req, res) => {
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

module.exports = router;
