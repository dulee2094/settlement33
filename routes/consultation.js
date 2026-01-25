const express = require('express');
const router = express.Router();
const { Consultation } = require('../models');

// Endpoint 1: Submit Consultation
router.post('/consultation', async (req, res) => {
    const { name, summary, details, phoneNumber } = req.body;
    try {
        await Consultation.create({ name, summary, details, phoneNumber });

        console.log(`[Consultation] New request from ${name} (${phoneNumber})`);
        res.json({ success: true, message: '상담 신청이 완료되었습니다.' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
});

// Endpoint 2: Admin - Get All Consultations
router.get('/admin/consultations', async (req, res) => {
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

module.exports = router;
