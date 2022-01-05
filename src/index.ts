import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import express from "express";
import { createConnection } from "typeorm";
import { buildSchema } from "type-graphql";
import http from "http";
import dotenv from "dotenv";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { PostResolver } from "./resolver/post";
import { UserResolver } from "./resolver/user";
//import url from "url";

dotenv.config();

async function main() {
  const app = express();
  const port = process.env.PORT || 5000;
  try {
    await createConnection();

    let RedisStore = connectRedis(session);

    const options =
      process.env.NODE_ENV !== "development"
        ? {
            sentinels: [{ host: "spinyfin.redistogo.com", port: 9148 }],
            password: "45d788a90b39fba8815ccaa8a604cdad",
            sentinelPassword: "45d788a90b39fba8815ccaa8a604cdad",
            name: "redistogo",
          }
        : undefined;
    const redisClient = new Redis(options);

    app.use(
      cors({
        origin: [],
        credentials: true,
      })
    );

    app.use(
      session({
        name: "auth-cookie",
        store: new RedisStore({
          client: redisClient,
          disableTTL: true,
          disableTouch: true,
        }),
        saveUninitialized: false,
        secret: process.env.SECRET_TOKEN ? process.env.SECRET_TOKEN : "",
        cookie: {
          maxAge: 1000 * 60 * 60 * 60 * 24 * 365,
          secure: process.env.NODE_ENV !== "development",
          httpOnly: true,
          sameSite: "lax",
        },
        resave: false,
      })
    );

    const httpServer = http.createServer(app);
    const server = new ApolloServer({
      schema: await buildSchema({
        resolvers: [UserResolver, PostResolver],
        validate: false,
      }),
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      context: ({ req, res }) => ({ req, res, Redis: redisClient }),
    });

    await server.start();
    server.applyMiddleware({ app, cors: false });
    await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
    console.log(
      `🚀 Server ready at http://localhost:${port}/${server.graphqlPath}`
    );
  } catch (error) {
    console.log(error);
  }
}

main();
