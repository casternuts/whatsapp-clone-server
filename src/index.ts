import { ApolloServer, gql, PubSub } from 'apollo-server-express';
import cookie from 'cookie';
import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from './app';
import { users } from '../db';
import { origin, port, secret } from './env';
import schema from '../schema';

const pubsub = new PubSub();
const server = new ApolloServer({
  schema,
  /*인증과 같은 전처리가 필요할 때 사용하는 객체. 
    헤더에 원하는 값을 실어줄 수 있고, middleware와 같은 개념이라고 생각하면 
  될 것 같다.*/
  context: (session: any) => {
    // Access the request object
    let req = session.connection
      ? session.connection.context.request
      : session.req;

    // It's subscription
    if (session.connection) {
      req.cookies = cookie.parse(req.headers.cookie || '');
    }
    let currentUser;

    if (req.cookies.authToken) {
      const username = jwt.verify(req.cookies.authToken, secret) as string;

      currentUser = username && users.find(u => u.username === username);
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
  app,
  path: '/graphql',
  cors: { credentials: true, origin },
});

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
