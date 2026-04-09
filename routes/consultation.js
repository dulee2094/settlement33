const express = require('express');
const router = express.Router();
const { Consultation } = require('../models');
const nodemailer = require('nodemailer');

// Endpoint 1: Submit Consultation
router.post('/consultation', async (req, res) => {
    const { name, summary, details, phoneNumber } = req.body;
    try {
        await Consultation.create({ name, summary, details, phoneNumber });

        console.log(`[Consultation] New request from ${name} (${phoneNumber})`);

        // 이메일 발송 (이메일 환경변수가 셋팅되었을 때만 작동)
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE || 'naver', // Render 환경변수(EMAIL_SERVICE)에서 불러오거나 기본값 네이버
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: 'dulee2094@cnalaw.co.kr',
                subject: `[세이프합의] 새로운 상담 신청 접수 (${name}님)`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #ddd; border-radius: 8px;">
                        <h2 style="color: #4A9EFF; margin-top: 0;">새로운 법률 상담 신청</h2>
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p><strong>신청인 이름:</strong> ${name}</p>
                        <p><strong>연락처:</strong> <a href="tel:${phoneNumber}">${phoneNumber}</a></p>
                        <br>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;"><strong>사건의 요지:</strong><br> ${summary.replace(/\n/g, '<br>')}</p>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;"><strong>상담 요청 내용:</strong><br> ${details.replace(/\n/g, '<br>')}</p>
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">본 메일은 세이프합의 웹사이트 시스템에서 자동 발송되었습니다.</p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions).catch(err => console.error('[이메일 발송 실패]', err));
        }

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
