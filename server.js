const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
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
    roomPassword: { type: DataTypes.STRING } // New: Room Password
});

const Proposal = sequelize.define('Proposal', {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    proposerId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT }
});

// Routes

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
    const { userId, caseNumber, role, summary } = req.body;

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
app.post('/api/case/create-room', async (req, res) => {
    const { userId, role, roomTitle, roomPassword, summary } = req.body;

    // Generate a unique case number (internal)
    const caseNumber = 'ROOM-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    try {
        const newCase = {
            caseNumber,
            roomTitle, // New Field
            roomPassword, // New Field
            summary,
            status: 'pending',
            connectionStatus: 'pending'
        };

        if (role === 'offender') newCase.offenderId = userId;
        else if (role === 'victim') newCase.victimId = userId;

        const caseData = await Case.create(newCase);
        res.json({ success: true, caseId: caseData.id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// 4.7 Search Rooms
app.get('/api/case/search', async (req, res) => {
    const { query } = req.query;
    const { Op } = require('sequelize');

    try {
        const cases = await Case.findAll({
            where: {
                roomTitle: {
                    [Op.like]: `%${query}%`
                },
                // Only show rooms that are not full
                [Op.or]: [
                    { offenderId: null },
                    { victimId: null }
                ]
            },
            limit: 20
        });

        // Map to safe public info
        const result = cases.map(c => ({
            id: c.id,
            roomTitle: c.roomTitle,
            creatorRole: c.offenderId ? '피의자' : '피해자',
            createdAt: c.createdAt
        }));

        res.json({ success: true, rooms: result });
    } catch (e) {
        console.error(e);
        res.json({ success: false, error: e.message });
    }
});

// 4.8 Join Room
app.post('/api/case/join-room', async (req, res) => {
    const { userId, caseId, password } = req.body;

    try {
        const caseData = await Case.findByPk(caseId);

        if (!caseData) return res.json({ success: false, error: '議댁옱?섏? ?딅뒗 諛⑹엯?덈떎.' });
        if (caseData.roomPassword !== password) return res.json({ success: false, error: '鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎.' });

        // Determine Role
        let myRole = '';
        if (caseData.offenderId && !caseData.victimId) {
            caseData.victimId = userId;
            myRole = 'victim';
        } else if (!caseData.offenderId && caseData.victimId) {
            caseData.offenderId = userId;
            myRole = 'offender';
        } else {
            return res.json({ success: false, error: '?대? ?몄썝??媛??李?諛⑹엯?덈떎.' });
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

// 6. Get Case Status (Match Info) - Returns ALL cases for user
app.get('/api/case/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json({ found: false, cases: [] });

    // Find ALL cases where user is offender OR victim
    const cases = await Case.findAll({
        where: sequelize.or(
            { offenderId: userId },
            { victimId: userId }
        )
    });

    if (!cases || cases.length === 0) {
        return res.json({ found: false, cases: [] });
    }

    // Process each case
    const caseList = await Promise.all(cases.map(async (caseData) => {
        let counterpartyName = null;
        const isOffender = (caseData.offenderId == userId);
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


// Initialize & Start
sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});