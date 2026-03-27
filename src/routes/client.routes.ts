import { FastifyInstance } from "fastify";
import { createClient, getAllClients, getClientById, updateClient, deleteClient } from "../controllers/client.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function clientRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: [authMiddleware] }, createClient);
  app.get("/", { preHandler: [authMiddleware] }, getAllClients);
  app.get("/:id", { preHandler: [authMiddleware] }, getClientById);
  app.put("/:id", { preHandler: [authMiddleware] }, updateClient);
  app.delete("/:id", { preHandler: [authMiddleware] }, deleteClient);
}
