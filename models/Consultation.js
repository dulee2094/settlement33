const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Consultation = sequelize.define('Consultation', {
    name: { type: DataTypes.STRING, allowNull: false }, // 신청인 이름 (추가됨)
    summary: { type: DataTypes.TEXT, allowNull: false }, // 사건 요지
    details: { type: DataTypes.TEXT, allowNull: false }, // 상담 상세 내용
    phoneNumber: { type: DataTypes.STRING, allowNull: false }, // 연락처
    status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending, completed
    submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = Consultation;
