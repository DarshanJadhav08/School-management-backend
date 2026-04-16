import { FastifyInstance } from "fastify";
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  getUnreadCountController,
  deleteNotificationController,
} from "../controllers/notification.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get("/", { preHandler: [authMiddleware] }, getNotificationsController);
  fastify.get("/unread-count", { preHandler: [authMiddleware] }, getUnreadCountController);
  fastify.patch("/:id/read", { preHandler: [authMiddleware] }, markAsReadController);
  fastify.patch("/mark-all-read", { preHandler: [authMiddleware] }, markAllAsReadController);
  fastify.delete("/:id", { preHandler: [authMiddleware] }, deleteNotificationController);
}
