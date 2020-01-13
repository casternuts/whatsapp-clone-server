"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tools_1 = require("graphql-tools");
const lodash_1 = require("lodash");
const commonModule = __importStar(require("../modules/common"));
const usersModule = __importStar(require("../modules/users"));
const chatsModule = __importStar(require("../modules/chats"));
exports.default = graphql_tools_1.makeExecutableSchema({
    resolvers: lodash_1.merge({}, commonModule.resolvers, usersModule.resolvers, chatsModule.resolvers),
    typeDefs: [commonModule.typeDefs, usersModule.typeDefs, chatsModule.typeDefs],
});
