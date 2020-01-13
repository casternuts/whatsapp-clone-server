"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const apollo_server_express_1 = require("apollo-server-express");
const core_1 = require("@graphql-modules/core");
const cookie_1 = __importDefault(require("cookie"));
const users_1 = __importDefault(require("../modules/users"));
const chats_1 = __importDefault(require("../modules/chats"));
exports.rootModule = new core_1.GraphQLModule({
    name: 'root',
    imports: [users_1.default, chats_1.default],
});
exports.server = new apollo_server_express_1.ApolloServer({
    schema: exports.rootModule.schema,
    context: (session) => {
        if (session.connection) {
            const req = session.connection.context.session.request;
            const cookies = req.headers.cookie;
            if (cookies) {
                req.cookies = cookie_1.default.parse(cookies);
            }
        }
        return exports.rootModule.context(session);
    },
    subscriptions: exports.rootModule.subscriptions,
});
