"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            const user = await User_1.default.findById(decoded.id).select('-passwordHash');
            if (!user) {
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }
            if (user.mustChangePassword) {
                const allowedPaths = ['/change-password', '/me'];
                const isAllowed = allowedPaths.some(p => req.originalUrl.includes(p));
                if (!isAllowed) {
                    res.status(403).json({ message: 'Password change required', code: 'PASSWORD_CHANGE_REQUIRED' });
                    return;
                }
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Not authorized to access this route' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
