"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@graphql-modules/core");
const di_1 = require("@graphql-modules/di");
const apollo_server_express_1 = require("apollo-server-express");
const graphql_iso_date_1 = require("graphql-iso-date");
const pg_1 = require("pg");
const db_1 = require("../../db");
const database_provider_1 = require("./database.provider");
const pubsub_provider_1 = require("./pubsub.provider");
const { PostgresPubSub } = require('graphql-postgres-subscriptions');
const typeDefs = apollo_server_express_1.gql `
  scalar DateTime

  type Query {
    _dummy: Boolean
  }

  type Mutation {
    _dummy: Boolean
  }

  type Subscription {
    _dummy: Boolean
  }
`;
const resolvers = {
    DateTime: graphql_iso_date_1.GraphQLDateTime,
};
const pubsub = new PostgresPubSub({
    host: 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: 'testuser',
    password: 'testpassword',
    database: 'whatsapp',
});
exports.default = new core_1.GraphQLModule({
    name: 'common',
    typeDefs,
    resolvers,
    providers: () => [
        {
            provide: pg_1.Pool,
            useValue: db_1.pool,
        },
        {
            provide: pubsub_provider_1.PubSub,
            scope: di_1.ProviderScope.Application,
            useValue: pubsub,
        },
        database_provider_1.Database,
    ],
});
