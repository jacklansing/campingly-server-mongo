import 'reflect-metadata';
import 'dotenv-safe/config';
import { __prod__, COOKIE_NAME } from './constants';
import express from 'express';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { createUserLoader } from './utils/createUserLoader';
import mongoose from 'mongoose';
import typeDefs from './schema/typeDefs';
import userResolver from './resolvers/user.resolver';
import campsiteResolver from './resolvers/campsite.resolver';
import {
  typeDefs as customScalarTypeDefs,
  resolvers as customScalarResolvers,
} from 'graphql-scalars';

const main = async () => {
  await mongoose.connect(process.env.MONGO_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });

  const app = express();

  const RedisStore = connectRedis(session);
  // Redis client
  const redis = new Redis(process.env.REDIS_URL);
  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 2, // 2 years
        httpOnly: true, // Prevents access to the cookie from the frontend js
        secure: __prod__, // Cookie onlyworks in https
        sameSite: 'lax', // csrf
        domain: __prod__ ? 'campingly.app' : 'localhost',
      },
      saveUninitialized: false, // Prevents storing empty sessions
      secret: process.env.SESSION_SECRET,
      resave: false,
    }),
  );

  const apolloServer = new ApolloServer({
    schema: makeExecutableSchema({
      typeDefs: [...customScalarTypeDefs, typeDefs],
      resolvers: [customScalarResolvers, userResolver, campsiteResolver],
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(parseInt(process.env.PORT), () => {
    console.log(`Server started on port ${process.env.PORT} 🐱‍🏍`);
  });
};

main();
