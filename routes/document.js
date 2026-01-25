const express = require('express');
const router = express.Router();
const { Document, User } = require('../models');

// Endpoint 8.1: Upload Document
router.post('/case/document', async (req, res) => {
    let { caseId, uploaderId, category, fileName, fileType, fileData } = req.body;
    uploaderId = parseInt(uploaderId, 10);
    try {
        await Document.create({
            caseId, uploaderId, category, fileName, fileType, fileData
        });

        res.json({ success: true });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint 8.2: List Documents (Metadata only)
router.get('/case/:caseId/documents', async (req, res) => {
    const { caseId } = req.params;
    try {
        const docs = await Document.findAll({
            where: { caseId },
            attributes: ['id', 'category', 'fileName', 'fileType', 'createdAt', 'uploaderId'], // Exclude heavy fileData
            order: [['createdAt', 'DESC']]
        });

        // Enrich with uploader name
        const result = await Promise.all(docs.map(async (d) => {
            const user = await User.findByPk(d.uploaderId);
            return {
                id: d.id,
                category: d.category,
                fileName: d.fileName,
                fileType: d.fileType,
                createdAt: d.createdAt,
                uploaderName: user ? user.name : '알 수 없음',
                isMine: false // To be handled by client using userId comparison
            };
        }));

        res.json({ success: true, documents: result });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

// Endpoint 8.3: Download Document
router.get('/document/:docId', async (req, res) => {
    try {
        const doc = await Document.findByPk(req.params.docId);
        if (!doc) return res.status(404).send('File not found');

        res.json({
            success: true,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileData: doc.fileData
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
