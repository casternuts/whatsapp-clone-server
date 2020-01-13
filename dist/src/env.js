"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.origin = process.env.ORIGIN || 'http://localhost:3000';
exports.port = process.env.PORT || 4000;
exports.expiration = process.env.JWT_EXPIRATION_MS
    ? parseInt(process.env.JWT_EXPIRATION_MS)
    : 24 * 60 * 60 * 1000;
exports.secret = process.env.JWT_SECRET || '70p53cr37';
