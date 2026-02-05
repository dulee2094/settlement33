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

// Better Static File Serving
// Serve root static files
app.use(express.static(__dirname));

// Serve sub-directories explicitly
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// explicit route for case_detail.html to ensure it works if requested without extension
app.get('/case_detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'case_detail.html'));
});
function loadRoute(path, name) {
    try {
        const route = require(path);
        app.use('/api/case' + (name === 'case' ? '' : '/' + name), route);
        console.log(`✅ Route loaded: ${name}`);
    } catch (e) {
        console.error(`❌ Failed to load route: ${name}`, e.message);
    }
}

// Manually load routes individually to prevent cascading failures
try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Route loaded: auth');
} catch (e) { console.error('❌ Failed to load route: auth', e.message); }

try {
    app.use('/api/notification', require('./routes/notification'));
    console.log('✅ Route loaded: notification');
} catch (e) { console.error('❌ Failed to load route: notification', e.message); }

// Case related routes
loadRoute('./routes/proposal', 'proposal');
loadRoute('./routes/apology', 'apology');
loadRoute('./routes/room', 'case'); // Mounted at /api/case (special case)
loadRoute('./routes/case', 'case'); // Mounted at /api/case (special case)

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Explicit 404 Handler for API
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// --- FRONTEND ROUTES ---

// explicit route for case_detail.html to ensure it works if requested without extension
app.get('/case_detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'case_detail.html'));
});

// Default Route (Serve Frontend)
// ONLY serve blind_proposal.html for non-asset requests (likely navigation)
app.get('*', (req, res) => {
    // If request has an extension that we likely missed or is 404
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
        return res.status(404).send('Not Found');
    }
    // Default fallback
    res.sendFile(path.join(__dirname, 'blind_proposal.html'));
});

// Database Sync & Server Start
// Using 'force: false' to not drop existing tables
// If models are not set up perfectly, we might skip sync to just run static server
async function startServer() {
    try {
        if (sequelize) {
            await sequelize.sync({ alter: true });
            console.log('✅ Database synced successfully (Schema Updated).');
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
