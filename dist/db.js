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
const pg_1 = require("pg");
const sql_template_strings_1 = __importDefault(require("sql-template-strings"));
const env_1 = require("./src/env");
exports.dbConfig = {
    host: 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: 'testuser',
    password: 'testpassword',
    database: 'whatsapp',
};
exports.pool = new pg_1.Pool(exports.dbConfig);
function initDb() {
    return __awaiter(this, void 0, void 0, function* () {
        // Clear tables
        yield exports.pool.query(sql_template_strings_1.default `DROP TABLE IF EXISTS messages;`);
        yield exports.pool.query(sql_template_strings_1.default `DROP TABLE IF EXISTS chats_users;`);
        yield exports.pool.query(sql_template_strings_1.default `DROP TABLE IF EXISTS users;`);
        yield exports.pool.query(sql_template_strings_1.default `DROP TABLE IF EXISTS chats;`);
        // Create tables
        yield exports.pool.query(sql_template_strings_1.default `CREATE TABLE chats(
    id SERIAL PRIMARY KEY
  );`);
        yield exports.pool.query(sql_template_strings_1.default `CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR (50) UNIQUE NOT NULL,
    name VARCHAR (50) NOT NULL,
    password VARCHAR (255) NOT NULL,
    picture VARCHAR (255) NOT NULL
  );`);
        yield exports.pool.query(sql_template_strings_1.default `CREATE TABLE chats_users(
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
  );`);
        yield exports.pool.query(sql_template_strings_1.default `CREATE TABLE messages(
    id SERIAL PRIMARY KEY,
    content VARCHAR (355) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
  );`);
        // Privileges
        yield exports.pool.query(sql_template_strings_1.default `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO testuser;`);
    });
}
exports.initDb = initDb;
exports.resetDb = () => __awaiter(void 0, void 0, void 0, function* () {
    yield initDb();
    const sampleUsers = [
        {
            id: '1',
            name: 'Ray Edwards',
            username: 'ray',
            password: '$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm',
            picture: 'https://randomuser.me/api/portraits/thumb/lego/1.jpg',
        },
        {
            id: '2',
            name: 'Ethan Gonzalez',
            username: 'ethan',
            password: '$2a$08$xE4FuCi/ifxjL2S8CzKAmuKLwv18ktksSN.F3XYEnpmcKtpbpeZgO',
            picture: 'https://randomuser.me/api/portraits/thumb/men/1.jpg',
        },
        {
            id: '3',
            name: 'Bryan Wallace',
            username: 'bryan',
            password: '$2a$08$UHgH7J8G6z1mGQn2qx2kdeWv0jvgHItyAsL9hpEUI3KJmhVW5Q1d.',
            picture: 'https://randomuser.me/api/portraits/thumb/men/2.jpg',
        },
        {
            id: '4',
            name: 'Avery Stewart',
            username: 'avery',
            password: '$2a$08$wR1k5Q3T9FC7fUgB7Gdb9Os/GV7dGBBf4PLlWT7HERMFhmFDt47xi',
            picture: 'https://randomuser.me/api/portraits/thumb/women/1.jpg',
        },
        {
            id: '5',
            name: 'Katie Peterson',
            username: 'katie',
            password: '$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242',
            picture: 'https://randomuser.me/api/portraits/thumb/women/2.jpg',
        },
    ];
    for (const sampleUser of sampleUsers) {
        console.log(`
    INSERT INTO users(id, name, username, password, picture)
    VALUES(${sampleUser.id}, ${sampleUser.name}, ${sampleUser.username}, ${sampleUser.password}, ${sampleUser.picture})
  `);
        yield exports.pool.query(sql_template_strings_1.default `
      INSERT INTO users(id, name, username, password, picture)
      VALUES(${sampleUser.id}, ${sampleUser.name}, ${sampleUser.username}, ${sampleUser.password}, ${sampleUser.picture})
    `);
    }
    yield exports.pool.query(sql_template_strings_1.default `SELECT setval('users_id_seq', (SELECT max(id) FROM users))`);
    yield exports.pool.query(sql_template_strings_1.default `DELETE FROM chats`);
    const sampleChats = [
        {
            id: '1',
        },
        {
            id: '2',
        },
        {
            id: '3',
        },
        {
            id: '4',
        },
    ];
    for (const sampleChat of sampleChats) {
        yield exports.pool.query(sql_template_strings_1.default `
      INSERT INTO chats(id)
      VALUES(${sampleChat.id})
    `);
    }
    yield exports.pool.query(sql_template_strings_1.default `SELECT setval('chats_id_seq', (SELECT max(id) FROM chats))`);
    yield exports.pool.query(sql_template_strings_1.default `DELETE FROM chats_users`);
    const sampleChatsUsers = [
        {
            chat_id: '1',
            user_id: '1',
        },
        {
            chat_id: '1',
            user_id: '2',
        },
        {
            chat_id: '2',
            user_id: '1',
        },
        {
            chat_id: '2',
            user_id: '3',
        },
        {
            chat_id: '3',
            user_id: '1',
        },
        {
            chat_id: '3',
            user_id: '4',
        },
        {
            chat_id: '4',
            user_id: '1',
        },
        {
            chat_id: '4',
            user_id: '5',
        },
    ];
    for (const sampleChatUser of sampleChatsUsers) {
        yield exports.pool.query(sql_template_strings_1.default `
      INSERT INTO chats_users(chat_id, user_id)
      VALUES(${sampleChatUser.chat_id}, ${sampleChatUser.user_id})
    `);
    }
    yield exports.pool.query(sql_template_strings_1.default `DELETE FROM messages`);
    const baseTime = new Date('1 Jan 2019 GMT').getTime();
    const sampleMessages = [
        {
            id: '1',
            content: 'You on your way?',
            created_at: new Date(baseTime - 60 * 1000 * 1000),
            chat_id: '1',
            sender_user_id: '1',
        },
        {
            id: '2',
            content: "Hey, it's me",
            created_at: new Date(baseTime - 2 * 60 * 1000 * 1000),
            chat_id: '2',
            sender_user_id: '1',
        },
        {
            id: '3',
            content: 'I should buy a boat',
            created_at: new Date(baseTime - 24 * 60 * 1000 * 1000),
            chat_id: '3',
            sender_user_id: '1',
        },
        {
            id: '4',
            content: 'This is wicked good ice cream.',
            created_at: new Date(baseTime - 14 * 24 * 60 * 1000 * 1000),
            chat_id: '4',
            sender_user_id: '1',
        },
    ];
    for (const sampleMessage of sampleMessages) {
        yield exports.pool.query(sql_template_strings_1.default `
      INSERT INTO messages(id, content, created_at, chat_id, sender_user_id)
      VALUES(${sampleMessage.id}, ${sampleMessage.content}, ${sampleMessage.created_at}, ${sampleMessage.chat_id}, ${sampleMessage.sender_user_id})
    `);
    }
    yield exports.pool.query(sql_template_strings_1.default `SELECT setval('messages_id_seq', (SELECT max(id) FROM messages))`);
});
if (env_1.resetDb) {
    exports.resetDb();
}
