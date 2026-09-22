"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const esgRecordController_1 = require("../controllers/esgRecordController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.route('/')
    .get(esgRecordController_1.getRecords)
    .post((0, authMiddleware_1.authorize)('PROJECT_OFFICER'), esgRecordController_1.createRecord);
router.route('/:id')
    .get(esgRecordController_1.getRecordById)
    .put((0, authMiddleware_1.authorize)('PROJECT_OFFICER'), esgRecordController_1.updateRecord);
router.post('/:id/validate', (0, authMiddleware_1.authorize)('PROJECT_OFFICER'), esgRecordController_1.validateRecordEndpoint);
router.post('/:id/submit', (0, authMiddleware_1.authorize)('PROJECT_OFFICER'), esgRecordController_1.submitRecord);
exports.default = router;
