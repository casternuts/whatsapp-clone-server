"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
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
const di_1 = require("@graphql-modules/di");
const sql_template_strings_1 = __importDefault(require("sql-template-strings"));
const database_provider_1 = require("../common/database.provider");
const pubsub_provider_1 = require("../common/pubsub.provider");
let Chats = class Chats {
    findChatsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT chats.* FROM chats, chats_users
      WHERE chats.id = chats_users.chat_id
      AND chats_users.user_id = ${userId}
    `);
            return rows;
        });
    }
    findChatByUser({ chatId, userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT chats.* FROM chats, chats_users
      WHERE chats_users.chat_id = ${chatId}
      AND chats.id = chats_users.chat_id
      AND chats_users.user_id = ${userId}
    `);
            return rows[0] || null;
        });
    }
    findChatById(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT * FROM chats WHERE id = ${chatId}
    `);
            return rows[0] || null;
        });
    }
    findMessagesByChat(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `SELECT * FROM messages WHERE chat_id = ${chatId}`);
            return rows;
        });
    }
    lastMessage(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT * FROM messages 
      WHERE chat_id = ${chatId} 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
            return rows[0];
        });
    }
    firstRecipient({ chatId, userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT users.* FROM users, chats_users
      WHERE users.id != ${userId}
      AND users.id = chats_users.user_id
      AND chats_users.chat_id = ${chatId}
    `);
            return rows[0] || null;
        });
    }
    participants(chatId) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT users.* FROM users, chats_users
      WHERE chats_users.chat_id = ${chatId}
      AND chats_users.user_id = users.id
    `);
            return rows;
        });
    }
    isParticipant({ chatId, userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT * FROM chats_users 
      WHERE chat_id = ${chatId} 
      AND user_id = ${userId}
    `);
            return !!rows.length;
        });
    }
    addMessage({ chatId, userId, content, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      INSERT INTO messages(chat_id, sender_user_id, content)
      VALUES(${chatId}, ${userId}, ${content})
      RETURNING *
    `);
            const messageAdded = rows[0];
            this.pubsub.publish('messageAdded', {
                messageAdded,
            });
            return messageAdded;
        });
    }
    addChat({ userId, recipientId, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            const { rows } = yield db.query(sql_template_strings_1.default `
      SELECT chats.* FROM chats, (SELECT * FROM chats_users WHERE user_id = ${userId}) AS chats_of_current_user, chats_users
      WHERE chats_users.chat_id = chats_of_current_user.chat_id
      AND chats.id = chats_users.chat_id
      AND chats_users.user_id = ${recipientId}
    `);
            // If there is already a chat between these two users, return it
            if (rows[0]) {
                return rows[0];
            }
            try {
                yield db.query('BEGIN');
                const { rows } = yield db.query(sql_template_strings_1.default `
        INSERT INTO chats
        DEFAULT VALUES
        RETURNING *
      `);
                const chatAdded = rows[0];
                yield db.query(sql_template_strings_1.default `
        INSERT INTO chats_users(chat_id, user_id)
        VALUES(${chatAdded.id}, ${userId})
      `);
                yield db.query(sql_template_strings_1.default `
        INSERT INTO chats_users(chat_id, user_id)
        VALUES(${chatAdded.id}, ${recipientId})
      `);
                yield db.query('COMMIT');
                this.pubsub.publish('chatAdded', {
                    chatAdded,
                });
                return chatAdded;
            }
            catch (e) {
                yield db.query('ROLLBACK');
                throw e;
            }
        });
    }
    removeChat({ chatId, userId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = yield this.db.getClient();
            try {
                yield db.query('BEGIN');
                const { rows } = yield db.query(sql_template_strings_1.default `
        SELECT chats.* FROM chats, chats_users
        WHERE id = ${chatId}
        AND chats.id = chats_users.chat_id
        AND chats_users.user_id = ${userId}
      `);
                const chat = rows[0];
                if (!chat) {
                    yield db.query('ROLLBACK');
                    return null;
                }
                yield db.query(sql_template_strings_1.default `
        DELETE FROM chats WHERE chats.id = ${chatId}
      `);
                this.pubsub.publish('chatRemoved', {
                    chatRemoved: chat.id,
                    targetChat: chat,
                });
                yield db.query('COMMIT');
                return chatId;
            }
            catch (e) {
                yield db.query('ROLLBACK');
                throw e;
            }
        });
    }
};
__decorate([
    di_1.Inject(),
    __metadata("design:type", database_provider_1.Database)
], Chats.prototype, "db", void 0);
__decorate([
    di_1.Inject(),
    __metadata("design:type", pubsub_provider_1.PubSub)
], Chats.prototype, "pubsub", void 0);
Chats = __decorate([
    di_1.Injectable({
        scope: di_1.ProviderScope.Session,
    })
], Chats);
exports.Chats = Chats;
