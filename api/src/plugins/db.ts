import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { db } from "../db";

export interface DbPluginOptions {}

async function dbPlugin(fastify: FastifyInstance) {
  return fastify.decorate("db", db);
}

// const dbPlugin: FastifyPluginAsync = async (fastify) => {
//   fastify.decorate("db", db);
// };

export default fp<DbPluginOptions>(dbPlugin, {
  name: "db",
});

declare module "fastify" {
  interface FastifyInstance {
    db: typeof db;
  }
}
