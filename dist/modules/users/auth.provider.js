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
const core_1 = require("@graphql-modules/core");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../src/env");
const validators_1 = require("../../src/validators");
const users_provider_1 = require("./users.provider");
let Auth = class Auth {
    get req() {
        return this.module.session.req || this.module.session.request;
    }
    get res() {
        return this.module.session.res;
    }
    signIn({ username, password }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.users.findByUsername(username);
            if (!user) {
                throw new Error('user not found');
            }
            const passwordsMatch = bcrypt_1.default.compareSync(password, user.password);
            if (!passwordsMatch) {
                throw new Error('password is incorrect');
            }
            const authToken = jsonwebtoken_1.default.sign(username, env_1.secret);
            this.res.cookie('authToken', authToken, { maxAge: env_1.expiration });
            return user;
        });
    }
    signUp({ name, password, passwordConfirm, username, }) {
        return __awaiter(this, void 0, void 0, function* () {
            validators_1.validateLength('req.name', name, 3, 50);
            validators_1.validateLength('req.username', username, 3, 18);
            validators_1.validatePassword('req.password', password);
            if (password !== passwordConfirm) {
                throw Error("req.password and req.passwordConfirm don't match");
            }
            const existingUser = yield this.users.findByUsername(username);
            if (existingUser) {
                throw Error('username already exists');
            }
            return this.users.newUser({
                username,
                name,
                password,
            });
        });
    }
    currentUser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.req.cookies.authToken) {
                const username = jsonwebtoken_1.default.verify(this.req.cookies.authToken, env_1.secret);
                if (username) {
                    return this.users.findByUsername(username);
                }
            }
            return null;
        });
    }
};
__decorate([
    di_1.Inject(),
    __metadata("design:type", users_provider_1.Users)
], Auth.prototype, "users", void 0);
__decorate([
    di_1.Inject(),
    __metadata("design:type", core_1.ModuleSessionInfo)
], Auth.prototype, "module", void 0);
Auth = __decorate([
    di_1.Injectable({
        scope: di_1.ProviderScope.Session,
    })
], Auth);
exports.Auth = Auth;
