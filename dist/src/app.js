"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./env");
exports.app = express_1.default();
exports.app.use(cors_1.default({ credentials: true, origin: env_1.origin }));
exports.app.use(express_1.default.json());
exports.app.use(cookie_parser_1.default());
exports.app.get('/_ping', (req, res) => {
    res.send('pong');
});
