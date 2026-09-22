"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplianceControls = exports.getActiveConfiguration = exports.getDisclosures = void 0;
const BRSRDisclosure_1 = __importDefault(require("../models/BRSRDisclosure"));
const RegulatoryConfiguration_1 = __importDefault(require("../models/RegulatoryConfiguration"));
const ComplianceControl_1 = __importDefault(require("../models/ComplianceControl"));
const getDisclosures = async (req, res) => {
    try {
        const activeConfig = await RegulatoryConfiguration_1.default.findOne({ status: 'ACTIVE' });
        let filter = {};
        if (activeConfig) {
            filter.regulatoryConfigId = activeConfig._id;
        }
        const disclosures = await BRSRDisclosure_1.default.find(filter).sort({ disclosureId: 1 });
        res.json(disclosures);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getDisclosures = getDisclosures;
const getActiveConfiguration = async (req, res) => {
    try {
        const config = await RegulatoryConfiguration_1.default.findOne({ status: 'ACTIVE' });
        if (!config)
            return res.status(404).json({ message: 'No active configuration found' });
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getActiveConfiguration = getActiveConfiguration;
const getComplianceControls = async (req, res) => {
    try {
        const controls = await ComplianceControl_1.default.find().sort({ controlId: 1 });
        res.json(controls);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getComplianceControls = getComplianceControls;
