"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@graphql-modules/core");
const apollo_server_express_1 = require("apollo-server-express");
const common_1 = __importDefault(require("../common"));
const users_provider_1 = require("./users.provider");
const auth_provider_1 = require("./auth.provider");
const typeDefs = apollo_server_express_1.gql `
  type User {
    id: ID!
    name: String!
    picture: String
  }

  extend type Query {
    me: User
    users: [User!]!
  }

  extend type Mutation {
    signIn(username: String!, password: String!): User
    signUp(
      name: String!
      username: String!
      password: String!
      passwordConfirm: String!
    ): User
  }
`;
const resolvers = {
    Query: {
        me(root, args, { injector }) {
            return injector.get(auth_provider_1.Auth).currentUser();
        },
        users(root, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return [];
                return injector.get(users_provider_1.Users).findAllExcept(currentUser.id);
            });
        },
    },
    Mutation: {
        signIn(root, { username, password }, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(auth_provider_1.Auth).signIn({ username, password });
            });
        },
        signUp(root, { name, username, password, passwordConfirm }, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector
                    .get(auth_provider_1.Auth)
                    .signUp({ name, username, password, passwordConfirm });
            });
        },
    },
};
exports.default = new core_1.GraphQLModule({
    name: 'users',
    typeDefs,
    resolvers,
    imports: () => [common_1.default],
    providers: () => [users_provider_1.Users, auth_provider_1.Auth],
});
