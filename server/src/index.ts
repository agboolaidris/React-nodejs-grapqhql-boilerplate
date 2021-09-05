import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { buildSchema } from "type-graphql";
import express from "express";
import http from "http";

//resolver
import AuthResolver from "./resolvers/auth";

async function Main() {
  const app = express();
  const httpServer = http.createServer(app);
  try {
    const server = new ApolloServer({
      schema: await buildSchema({
        resolvers: [AuthResolver],
        validate: false,
      }),
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });
    await createConnection();
    await server.start();
    server.applyMiddleware({ app });
    httpServer.listen({ port: 4000 }, () => {
      console.log(
        `🚀 Server ready at http://localhost:4000${server.graphqlPath}`
      );
    });
  } catch (error) {
    console.log(error);
  }
}

Main();
