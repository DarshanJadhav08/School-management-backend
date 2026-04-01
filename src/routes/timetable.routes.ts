import { FastifyInstance } from "fastify";
import timetableController from "../controllers/timetable.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function timetableRoutes(fastify: FastifyInstance) {

  fastify.post("/:client_id", { preHandler: [authMiddleware] }, timetableController.create);
  fastify.get("/:client_id", { preHandler: [authMiddleware] }, timetableController.getAll);
  fastify.get("/:client_id/day", { preHandler: [authMiddleware] }, timetableController.getByDay);
  fastify.get("/:client_id/date", { preHandler: [authMiddleware] }, timetableController.getByDate);
  fastify.get("/:client_id/:id", { preHandler: [authMiddleware] }, timetableController.getById);
  fastify.put("/:client_id/:id", { preHandler: [authMiddleware] }, timetableController.update);
  fastify.delete("/:client_id/:id", { preHandler: [authMiddleware] }, timetableController.delete);
}
