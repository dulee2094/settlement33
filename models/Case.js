const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
    roomPassword: { type: DataTypes.STRING }, // New: Room Password
    creatorId: { type: DataTypes.INTEGER }, // New: Explicit Creator Tracking
    apologyContent: { type: DataTypes.TEXT }, // New: Apology Letter Content
    apologyStatus: { type: DataTypes.ENUM('none', 'sent', 'read'), defaultValue: 'none' }, // New: Apology Status
    proposalExtendOffender: { type: DataTypes.BOOLEAN, defaultValue: false },
    proposalExtendVictim: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Midpoint Agreement (10% within) - 2-Step Process
    midpointProposed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Whether midpoint agreement is proposed
    midpointAmount: { type: DataTypes.INTEGER }, // The calculated midpoint amount

    // Step 1: Procedure Agreement (절차 시작 동의)
    midpointProcedureOffenderAgreed: { type: DataTypes.BOOLEAN, defaultValue: false },
    midpointProcedureVictimAgreed: { type: DataTypes.BOOLEAN, defaultValue: false },

    // Step 2: Final Agreement (최종 합의 동의)
    midpointOffenderAgreed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Offender's final agreement
    midpointVictimAgreed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Victim's final agreement

    // Status Tracking
    midpointAmountRevealed: { type: DataTypes.BOOLEAN, defaultValue: false }, // Whether amount has been revealed
    midpointRejected: { type: DataTypes.BOOLEAN, defaultValue: false }, // If midpoint rejected
    midpointRejectedBy: { type: DataTypes.STRING }, // 'offender', 'victim', or 'both'
    midpointRejectedAt: { type: DataTypes.DATE }, // When rejected

    // Round Transition Intent (Next Round)
    nextRoundIntentOffender: { type: DataTypes.BOOLEAN, defaultValue: false },
    nextRoundIntentVictim: { type: DataTypes.BOOLEAN, defaultValue: false },

    finalAmount: { type: DataTypes.INTEGER }
});

module.exports = Case;
