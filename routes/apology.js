const express = require('express');
const router = express.Router();
const { Case } = require('../models');

// ============================================
// ✍️ Apology Management Routes
// ============================================

router.post('/', async (req, res) => { // Mounted at /apology, so '/' means /api/case/apology/
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

router.get('/', async (req, res) => {
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
