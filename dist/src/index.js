"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const cookie_1 = __importDefault(require("cookie"));
const http_1 = __importDefault(require("http"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = require("./app");
const db_1 = require("../db");
const env_1 = require("./env");
const schema_1 = __importDefault(require("../schema"));
const pubsub = new apollo_server_express_1.PubSub();
const server = new apollo_server_express_1.ApolloServer({
    schema: schema_1.default,
    /*인증과 같은 전처리가 필요할 때 사용하는 객체.
      헤더에 원하는 값을 실어줄 수 있고, middleware와 같은 개념이라고 생각하면
    될 것 같다.*/
    context: (session) => {
        // Access the request object
        let req = session.connection
            ? session.connection.context.request
            : session.req;
        // It's subscription
        if (session.connection) {
            req.cookies = cookie_1.default.parse(req.headers.cookie || '');
        }
        let currentUser;
        if (req.cookies.authToken) {
            const username = jsonwebtoken_1.default.verify(req.cookies.authToken, env_1.secret);
            currentUser = username && db_1.users.find(u => u.username === username);
        }
        return {
            currentUser: currentUser,
            pubsub,
            res: session.res,
        };
    },
    subscriptions: {
        onConnect(params, ws, ctx) {
            // pass the request object to context
            return {
                request: ctx.request,
            };
        },
    },
});
server.applyMiddleware({
    app: app_1.app,
    path: '/graphql',
    cors: { credentials: true, origin: env_1.origin },
});
const httpServer = http_1.default.createServer(app_1.app);
server.installSubscriptionHandlers(httpServer);
httpServer.listen(env_1.port, () => {
    console.log(`Server is listening on port ${env_1.port}`);
});
