"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const organizationController_1 = require("../controllers/organizationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect); // All org routes require authentication
router.route('/')
    .get(organizationController_1.getOrganizations)
    .post((0, authMiddleware_1.authorize)('ADMIN'), organizationController_1.createOrganization);
router.route('/my-network').get(organizationController_1.getMyNetwork);
router.route('/:id')
    .get(organizationController_1.getOrganizationById)
    .put((0, authMiddleware_1.authorize)('ADMIN'), organizationController_1.updateOrganization)
    .delete((0, authMiddleware_1.authorize)('ADMIN'), organizationController_1.deleteOrganization);
exports.default = router;
