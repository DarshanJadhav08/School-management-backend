import { FastifyInstance } from "fastify";
import {
  createComplaintController,
  getComplaintsController,
  deleteComplaintController,
  addResponseController,
  getStudentComplaintsController,
} from "../controllers/complaint.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function complaintRoutes(fastify: FastifyInstance) {
  fastify.post("/", { preHandler: [authMiddleware] }, createComplaintController);
  fastify.get("/", { preHandler: [authMiddleware] }, getComplaintsController);
  fastify.get("/my-complaints", { preHandler: [authMiddleware] }, getStudentComplaintsController);
  fastify.patch("/:id/response", { preHandler: [authMiddleware] }, addResponseController);
  fastify.delete("/:id", { preHandler: [authMiddleware] }, deleteComplaintController);
}
