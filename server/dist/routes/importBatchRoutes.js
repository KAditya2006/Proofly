"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const importBatchController_1 = require("../controllers/importBatchController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)('ADMIN', 'GROUP_ESG_TEAM'));
router.get('/', importBatchController_1.getImportBatches);
router.get('/:id', importBatchController_1.getImportBatch);
exports.default = router;
