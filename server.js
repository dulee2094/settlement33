const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./models'); // Assuming models/index.js exists

const app = express();
const PORT = process.env.PORT || 3300;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/'))); // Serve static files from root

// Routes
// Note: Adjusting paths based on your file structure conventions

// Health Check Endpoint (for Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

try {
    const proposalRoutes = require('./routes/proposal');
    const caseRoutes = require('./routes/case');
    const authRoutes = require('./routes/auth');

    app.use('/api/case/proposal', proposalRoutes);
    app.use('/api/case', caseRoutes);
    app.use('/api/auth', authRoutes);

    console.log('✅ All API routes loaded successfully');
} catch (error) {
    console.warn("⚠️ Some routes could not be loaded:", error.message);
    console.warn("Stack trace:", error.stack);
}

// Default Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'blind_proposal.html')); // Default to blind_proposal for easy testing
});

// Database Sync & Server Start
// Using 'force: false' to not drop existing tables
// If models are not set up perfectly, we might skip sync to just run static server
async function startServer() {
    try {
        if (sequelize) {
            await sequelize.sync({ force: false });
            console.log('✅ Database synced successfully.');
        }
    } catch (err) {
        console.error('⚠️ Database sync failed (continuing anyway):', err.message);
        console.log('Server will continue running for static file serving.');
    }

    // Bind to 0.0.0.0 to accept external connections (required for Render)
    const HOST = process.env.HOST || '0.0.0.0';

    app.listen(PORT, HOST, () => {
        console.log(`✅ Server is running on ${HOST}:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Test Page: http://localhost:${PORT}/blind_proposal.html`);
        }
    }).on('error', (err) => {
        console.error('❌ Server failed to start:', err.message);
        process.exit(1);
    });
}

startServer();
