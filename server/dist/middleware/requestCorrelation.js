"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestCorrelation = void 0;
const crypto_1 = __importDefault(require("crypto"));
const requestCorrelation = (req, res, next) => {
    const reqId = req.headers['x-request-id'] || `req_${crypto_1.default.randomUUID()}`;
    req.id = reqId;
    // Set on response so client can trace
    res.setHeader('X-Request-ID', reqId);
    next();
};
exports.requestCorrelation = requestCorrelation;
