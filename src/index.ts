import 'reflect-metadata';
import 'dotenv-safe/config';
import { __prod__, COOKIE_NAME } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import cors from 'cors';
import { createConnection } from 'typeorm';
import { createUserLoader } from './utils/createUserLoader';
import { createSchema } from './utils/createSchema';

const main = async () => {
  // Connection config loaded automatically.
  // See ormconfig.js
  const conn = await createConnection();
  // Run migrations after connection
  await conn.runMigrations();

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

  const schema = await createSchema();
  const apolloServer = new ApolloServer({
    schema,
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
