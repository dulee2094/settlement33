const sequelize = require('../config/database');
const User = require('./User');
const Case = require('./Case');
const Proposal = require('./Proposal');
const Message = require('./Message');
const PaymentReq = require('./PaymentReq');
const Consultation = require('./Consultation');
const Document = require('./Document');

// Associations
// Case.hasMany(Proposal, { foreignKey: 'caseId' });
// Proposal.belongsTo(Case, { foreignKey: 'caseId' });

module.exports = {
    sequelize,
    User,
    Case,
    Proposal,
    Message,
    PaymentReq,
    Consultation,
    Document
};
