import { FastifyInstance } from "fastify";
import { SchoolClassService } from "../services/schoolClass.service";
import { SchoolClassController } from "../controllers/schoolClass.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function schoolClassRoutes(fastify: FastifyInstance) {
  const service = new SchoolClassService();
  const controller = new SchoolClassController(service);

  fastify.post("/admin/add-class/:client_id", { preHandler: authMiddleware }, controller.addClass);
  fastify.post("/admin/add-multiple-classes/:client_id", { preHandler: authMiddleware }, controller.addMultipleClasses);
  fastify.delete("/admin/delete-class/:id", { preHandler: authMiddleware }, controller.deleteClass);
  fastify.get("/teacher/classes/:client_id", { preHandler: authMiddleware }, controller.getActiveClasses);
}