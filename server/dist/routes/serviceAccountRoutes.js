"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const serviceAccountController_1 = require("../controllers/serviceAccountController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.use((0, authMiddleware_1.authorize)('ADMIN'));
router.get('/', serviceAccountController_1.getServiceAccounts);
router.post('/', serviceAccountController_1.createServiceAccount);
router.put('/:id/revoke', serviceAccountController_1.revokeServiceAccount);
exports.default = router;
