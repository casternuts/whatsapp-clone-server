"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apollo_server_express_1 = require("apollo-server-express");
const graphql_scalars_1 = require("graphql-scalars");
const db_1 = require("../db");
const env_1 = require("../src/env");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validators_1 = require("../src/validators");
const resolvers = {
    Date: graphql_scalars_1.DateTimeResolver,
    URL: graphql_scalars_1.URLResolver,
    Message: {
        chat(message) {
            return db_1.chats.find(c => c.messages.some(m => m === message.id)) || null;
        },
        sender(message) {
            return db_1.users.find(u => u.id === message.sender) || null;
        },
        recipient(message) {
            return db_1.users.find(u => u.id === message.recipient) || null;
        },
        isMine(message, args, { currentUser }) {
            return message.sender === currentUser.id;
        },
    },
    Chat: {
        name(chat, args, { currentUser }) {
            if (!currentUser)
                return null;
            const participantId = chat.participants.find((p) => p !== currentUser.id);
            if (!participantId)
                return null;
            const participant = db_1.users.find(u => u.id === participantId);
            return participant ? participant.name : null;
        },
        picture(chat, args, { currentUser }) {
            if (!currentUser)
                return null;
            const participantId = chat.participants.find((p) => p !== currentUser.id);
            if (!participantId)
                return null;
            const participant = db_1.users.find(u => u.id === participantId);
            return participant ? participant.picture : null;
        },
        messages(chat) {
            return db_1.messages.filter(m => chat.messages.includes(m.id));
        },
        lastMessage(chat) {
            const lastMessage = chat.messages[chat.messages.length - 1];
            return db_1.messages.find(m => m.id === lastMessage) || null;
        },
        participants(chat) {
            return chat.participants
                .map((p) => db_1.users.find(u => u.id === p))
                .filter(Boolean);
        },
    },
    Query: {
        me(root, args, { currentUser }) {
            return currentUser || null;
        },
        chats(root, args, { currentUser }) {
            if (!currentUser)
                return [];
            return db_1.chats.filter(c => c.participants.includes('1'));
        },
        chat(root, { chatId }, { currentUser }) {
            if (!currentUser)
                return null;
            const chat = db_1.chats.find(c => c.id === chatId);
            if (!chat)
                return null;
            return chat.participants.includes(currentUser.id) ? chat : null;
        },
        users(root, args, { currentUser }) {
            if (!currentUser)
                return [];
            return db_1.users.filter(u => u.id !== currentUser.id);
        },
    },
    Mutation: {
        signIn(root, { username, password }, { res }) {
            console.log('signIn1', username, password);
            const user = db_1.users.find(u => u.username === username);
            if (!user) {
                throw new Error('user not found');
            }
            const passwordsMatch = bcrypt_1.default.compareSync(password, user.password);
            if (!passwordsMatch) {
                throw new Error('password is incorrect');
            }
            const authToken = jsonwebtoken_1.default.sign(username, env_1.secret);
            res.cookie('authToken', authToken, { maxAge: env_1.expiration });
            console.log('signIn', user);
            return user;
        },
        signUp(root, { name, username, password, passwordConfirm }) {
            console.log(name, username, password, passwordConfirm);
            validators_1.validateLength('req.name', name, 3, 50);
            validators_1.validateLength('req.username', username, 3, 18);
            validators_1.validatePassword('req.password', password);
            if (password !== passwordConfirm) {
                throw Error("req.password and req.passwordConfirm don't match");
            }
            if (db_1.users.some(u => u.username === username)) {
                throw Error('username already exists');
            }
            const passwordHash = bcrypt_1.default.hashSync(password, bcrypt_1.default.genSaltSync(8));
            const user = {
                id: String(db_1.users.length + 1),
                password: passwordHash,
                picture: '',
                username,
                name,
            };
            db_1.users.push(user);
            return user;
        },
        addMessage(root, { chatId, content }, { currentUser, pubsub }) {
            if (!currentUser)
                return null;
            const chatIndex = db_1.chats.findIndex(c => c.id === chatId);
            if (chatIndex === -1)
                return null;
            const chat = db_1.chats[chatIndex];
            if (!chat.participants.includes(currentUser.id))
                return null;
            const messagesIds = db_1.messages.map(currentMessage => Number(currentMessage.id));
            const messageId = String(Math.max(...messagesIds) + 1);
            const message = {
                id: messageId,
                createdAt: new Date(),
                sender: currentUser.id,
                recipient: chat.participants.find(p => p !== currentUser.id),
                content,
            };
            db_1.messages.push(message);
            chat.messages.push(messageId);
            // The chat will appear at the top of the ChatsList component
            db_1.chats.splice(chatIndex, 1);
            db_1.chats.unshift(chat);
            pubsub.publish('messageAdded', {
                messageAdded: message,
            });
            return message;
        },
        addChat(root, { recipientId }, { currentUser, pubsub }) {
            if (!currentUser)
                return null;
            if (!db_1.users.some(u => u.id === recipientId))
                return null;
            let chat = db_1.chats.find(c => c.participants.includes(currentUser.id) &&
                c.participants.includes(recipientId));
            if (chat)
                return chat;
            const chatsIds = db_1.chats.map(c => Number(c.id));
            chat = {
                id: String(Math.max(...chatsIds) + 1),
                participants: [currentUser.id, recipientId],
                messages: [],
            };
            db_1.chats.push(chat);
            pubsub.publish('chatAdded', {
                chatAdded: chat,
            });
            return chat;
        },
        removeChat(root, { chatId }, { currentUser, pubsub }) {
            if (!currentUser)
                return null;
            const chatIndex = db_1.chats.findIndex(c => c.id === chatId);
            if (chatIndex === -1)
                return null;
            const chat = db_1.chats[chatIndex];
            if (!chat.participants.some(p => p === currentUser.id))
                return null;
            chat.messages.forEach(chatMessage => {
                const chatMessageIndex = db_1.messages.findIndex(m => m.id === chatMessage);
                if (chatMessageIndex !== -1) {
                    db_1.messages.splice(chatMessageIndex, 1);
                }
            });
            db_1.chats.splice(chatIndex, 1);
            pubsub.publish('chatRemoved', {
                chatRemoved: chat.id,
                targetChat: chat,
            });
            return chatId;
        },
    },
    Subscription: {
        messageAdded: {
            subscribe: apollo_server_express_1.withFilter((root, args, { pubsub }) => pubsub.asyncIterator('messageAdded'), ({ messageAdded }, args, { currentUser }) => {
                if (!currentUser)
                    return false;
                return [messageAdded.sender, messageAdded.recipient].includes(currentUser.id);
            }),
        },
        chatAdded: {
            subscribe: apollo_server_express_1.withFilter((root, args, { pubsub }) => pubsub.asyncIterator('chatAdded'), ({ chatAdded }, args, { currentUser }) => {
                if (!currentUser)
                    return false;
                return chatAdded.participants.some(p => p === currentUser.id);
            }),
        },
        chatRemoved: {
            subscribe: apollo_server_express_1.withFilter((root, args, { pubsub }) => pubsub.asyncIterator('chatRemoved'), ({ targetChat }, args, { currentUser }) => {
                if (!currentUser)
                    return false;
                return targetChat.participants.some(p => p === currentUser.id);
            }),
        },
    },
};
exports.default = resolvers;
