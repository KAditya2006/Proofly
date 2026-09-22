"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect); // All project routes require authentication
router.route('/')
    .get(projectController_1.getProjects)
    .post((0, authMiddleware_1.authorize)('ADMIN'), projectController_1.createProject);
router.route('/:id')
    .get(projectController_1.getProjectById)
    .put((0, authMiddleware_1.authorize)('ADMIN'), projectController_1.updateProject)
    .delete((0, authMiddleware_1.authorize)('ADMIN'), projectController_1.deleteProject);
exports.default = router;
