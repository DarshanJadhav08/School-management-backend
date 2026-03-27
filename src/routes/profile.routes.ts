import { FastifyInstance } from "fastify";
import { getUniversalProfileController } from "../controllers/profile.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function profileRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [authMiddleware] }, getUniversalProfileController);
}
