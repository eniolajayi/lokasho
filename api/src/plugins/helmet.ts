import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";

async function helmetPlugin(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    crossOriginResourcePolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: true,
    // Other Helmet options
  });
}

export default fp(helmetPlugin, {
  name: "helmet",
});
