const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
    caseId: { type: DataTypes.INTEGER, allowNull: false },
    uploaderId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.STRING, allowNull: false }, // apology, settlement, evidence, etc.
    fileName: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.STRING }, // mime type
    fileData: { type: DataTypes.TEXT('long'), allowNull: false } // Base64 storage for MVP
});

module.exports = Document;
