import { FastifyInstance } from "fastify";
import { 
  getNotificationsController, 
  markAsReadController 
} from "../controllers/notification.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authMiddleware] }, getNotificationsController);
  fastify.patch("/:id/read", { preHandler: [authMiddleware] }, markAsReadController);
}
