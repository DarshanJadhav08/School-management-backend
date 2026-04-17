import { FastifyInstance } from "fastify";
import { getAllUsers, getUserById, updateUser, deleteUser, getUserStatistics, getAllStatistics, updateFcmToken, logoutController } from "../controllers/user.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function userRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [authMiddleware] }, getAllUsers);
  app.get("/statistics", { preHandler: [authMiddleware] }, getUserStatistics);
  app.get("/all-statistics", { preHandler: [authMiddleware] }, getAllStatistics);
  app.get("/:id", { preHandler: [authMiddleware] }, getUserById);
  app.put("/:id", { preHandler: [authMiddleware] }, updateUser);
  app.delete("/:id", { preHandler: [authMiddleware] }, deleteUser);
  app.patch("/fcm-token", { preHandler: [authMiddleware] }, updateFcmToken);
  app.post("/logout", { preHandler: [authMiddleware] }, logoutController);
}
