const express = require('express');
const router = express.Router();
const { PaymentReq } = require('../models');

// 5.6 Payment Request System (Real)
router.post('/', async (req, res) => {
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

router.get('/', async (req, res) => {
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

module.exports = router;
