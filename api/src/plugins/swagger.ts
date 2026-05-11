import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export interface SwaggerPluginOptions {}

async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: "Lokasho API",
        description: "Sun-dry laundry tracker API",
        version: "0.1.0",
      },
      servers: [{ url: "http://localhost:3000" }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}

export default fp(swaggerPlugin, { name: "swagger" });
