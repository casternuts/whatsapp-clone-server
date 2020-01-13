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
const users_1 = __importDefault(require("../users"));
const users_provider_1 = require("./../users/users.provider");
const auth_provider_1 = require("./../users/auth.provider");
const chats_provider_1 = require("./chats.provider");
const pubsub_provider_1 = require("../common/pubsub.provider");
const typeDefs = apollo_server_express_1.gql `
  type Message {
    id: ID!
    content: String!
    createdAt: DateTime!
    chat: Chat
    sender: User
    recipient: User
    isMine: Boolean!
  }

  type Chat {
    id: ID!
    name: String
    picture: String
    lastMessage: Message
    messages: [Message!]!
    participants: [User!]!
  }

  extend type Query {
    chats: [Chat!]!
    chat(chatId: ID!): Chat
  }

  extend type Mutation {
    addMessage(chatId: ID!, content: String!): Message
    addChat(recipientId: ID!): Chat
    removeChat(chatId: ID!): ID
  }

  extend type Subscription {
    messageAdded: Message!
    chatAdded: Chat!
    chatRemoved: ID!
  }
`;
const resolvers = {
    Message: {
        createdAt(message) {
            return new Date(message.created_at);
        },
        chat(message, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(chats_provider_1.Chats).findChatById(message.chat_id);
            });
        },
        sender(message, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(users_provider_1.Users).findById(message.sender_user_id);
            });
        },
        recipient(message, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(chats_provider_1.Chats).firstRecipient({
                    chatId: message.chat_id,
                    userId: message.sender_user_id,
                });
            });
        },
        isMine(message, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                return message.sender_user_id === currentUser.id;
            });
        },
    },
    Chat: {
        name(chat, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return null;
                const participant = yield injector.get(chats_provider_1.Chats).firstRecipient({
                    chatId: chat.id,
                    userId: currentUser.id,
                });
                return participant ? participant.name : null;
            });
        },
        picture(chat, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return null;
                const participant = yield injector.get(chats_provider_1.Chats).firstRecipient({
                    chatId: chat.id,
                    userId: currentUser.id,
                });
                return participant && participant.picture ? participant.picture : null;
            });
        },
        messages(chat, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(chats_provider_1.Chats).findMessagesByChat(chat.id);
            });
        },
        lastMessage(chat, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(chats_provider_1.Chats).lastMessage(chat.id);
            });
        },
        participants(chat, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                return injector.get(chats_provider_1.Chats).participants(chat.id);
            });
        },
    },
    Query: {
        chats(root, args, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return [];
                return injector.get(chats_provider_1.Chats).findChatsByUser(currentUser.id);
            });
        },
        chat(root, { chatId }, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return null;
                return injector
                    .get(chats_provider_1.Chats)
                    .findChatByUser({ chatId, userId: currentUser.id });
            });
        },
    },
    Mutation: {
        addMessage(root, { chatId, content }, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return null;
                return injector
                    .get(chats_provider_1.Chats)
                    .addMessage({ chatId, content, userId: currentUser.id });
            });
        },
        addChat(root, { recipientId }, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return null;
                return injector
                    .get(chats_provider_1.Chats)
                    .addChat({ recipientId, userId: currentUser.id });
            });
        },
        removeChat(root, { chatId }, { injector }) {
            return __awaiter(this, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return null;
                return injector.get(chats_provider_1.Chats).removeChat({ chatId, userId: currentUser.id });
            });
        },
    },
    Subscription: {
        messageAdded: {
            subscribe: apollo_server_express_1.withFilter((root, args, { injector }) => injector.get(pubsub_provider_1.PubSub).asyncIterator('messageAdded'), ({ messageAdded }, args, { injector }) => __awaiter(void 0, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return false;
                return injector.get(chats_provider_1.Chats).isParticipant({
                    chatId: messageAdded.chat_id,
                    userId: currentUser.id,
                });
            })),
        },
        chatAdded: {
            subscribe: apollo_server_express_1.withFilter((root, args, { injector }) => injector.get(pubsub_provider_1.PubSub).asyncIterator('chatAdded'), ({ chatAdded }, args, { injector }) => __awaiter(void 0, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return false;
                return injector.get(chats_provider_1.Chats).isParticipant({
                    chatId: chatAdded.id,
                    userId: currentUser.id,
                });
            })),
        },
        chatRemoved: {
            subscribe: apollo_server_express_1.withFilter((root, args, { injector }) => injector.get(pubsub_provider_1.PubSub).asyncIterator('chatRemoved'), ({ targetChat }, args, { injector }) => __awaiter(void 0, void 0, void 0, function* () {
                const currentUser = yield injector.get(auth_provider_1.Auth).currentUser();
                if (!currentUser)
                    return false;
                return injector.get(chats_provider_1.Chats).isParticipant({
                    chatId: targetChat.id,
                    userId: currentUser.id,
                });
            })),
        },
    },
};
exports.default = new core_1.GraphQLModule({
    name: 'chats',
    typeDefs,
    resolvers,
    imports: () => [common_1.default, users_1.default],
    providers: () => [chats_provider_1.Chats],
});
