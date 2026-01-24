const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./models/index.js');

const authRoutes = require('./routes/auth');
const caseRoutes = require('./routes/case');
const proposalRoutes = require('./routes/proposal');
const simpleProposalRoutes = require('./routes/simpleProposal');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');
const documentRoutes = require('./routes/document');
const consultationRoutes = require('./routes/consultation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '/'))); // Serve frontend files

// Routes Mapping
app.use('/api', authRoutes); // /api/signup, /api/login
app.use('/api/case', caseRoutes); // /api/case/link, /api/case/invite, etc.
app.use('/api/case/proposal', proposalRoutes); // /api/case/proposal (GET/POST), /view-result
app.use('/api/proposal', simpleProposalRoutes); // /api/proposal (POST)
app.use('/api/case/chat', chatRoutes); // /api/case/chat (GET/POST)
app.use('/api/case/payment-request', paymentRoutes); // /api/case/payment-request
app.use('/api', documentRoutes); // /api/case/document, /api/case/:caseId/documents, /api/document/:docId
app.use('/api', consultationRoutes); // /api/consultation, /api/admin/consultations

// Sync Database & Start Server
sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Database sync failed:', err);
});
