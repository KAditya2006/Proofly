"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueChainDashboard = void 0;
const ValueChainPartner_1 = __importDefault(require("../models/ValueChainPartner"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get Value Chain Dashboard Stats
// @route   GET /api/value-chain/dashboard
// @access  Private
const getValueChainDashboard = async (req, res) => {
    try {
        const { reportingPeriodId } = req.query;
        if (!reportingPeriodId) {
            res.status(400).json({ message: 'Reporting period is required' });
            return;
        }
        // Enforce RBAC Scope
        const { role, organizationId } = req.user;
        let query = { reportingPeriodId: new mongoose_1.default.Types.ObjectId(reportingPeriodId) };
        if (role === 'BUSINESS_UNIT_REVIEWER' || role === 'SUBSIDIARY_MANAGER') {
            query.organizationId = organizationId;
        }
        else if (role === 'PROJECT_OFFICER') {
            res.status(403).json({ message: 'Unauthorized for Value Chain management' });
            return;
        }
        const partners = await ValueChainPartner_1.default.find(query);
        const total = partners.length;
        const requested = partners.filter(p => p.status === 'DATA_REQUESTED').length;
        const submitted = partners.filter(p => p.status === 'DATA_SUBMITTED').length;
        const approved = partners.filter(p => p.status === 'APPROVED').length;
        // Coverage = (Approved / Total) * 100
        const coverage = total > 0 ? Math.round((approved / total) * 100) : 0;
        res.json({
            metrics: {
                total,
                requested,
                submitted,
                approved,
                pending: total - approved,
                coverage
            },
            partners // We can send all partners for the list view in MVP
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error loading Value Chain data' });
    }
};
exports.getValueChainDashboard = getValueChainDashboard;
