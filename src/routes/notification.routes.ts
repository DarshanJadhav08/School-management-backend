import { FastifyInstance } from "fastify";
import { 
  getNotificationsController, 
  markAsReadController 
} from "../controllers/notification.controller";

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", getNotificationsController);
  fastify.patch("/:id/read", markAsReadController);
}
