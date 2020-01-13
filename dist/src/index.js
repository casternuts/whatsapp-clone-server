"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./env");
const server_1 = require("./server");
server_1.server.applyMiddleware({
    app: app_1.app,
    path: '/graphql',
    cors: { credentials: true, origin: env_1.origin },
});
const httpServer = http_1.default.createServer(app_1.app);
server_1.server.installSubscriptionHandlers(httpServer);
httpServer.listen(env_1.port, () => {
    console.log(`Server is listening on port ${env_1.port}`);
});
