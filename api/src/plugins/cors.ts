import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import Cors from "@fastify/cors";

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(Cors, {
    origin: true,
    methods: ["GET", "PUT", "PATCH", "POST", "DELETE"],
    credentials: true,
  });
}

export default fp(corsPlugin, {
  name: "cors",
});
