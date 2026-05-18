import { FastifyInstance } from "fastify";
import { signupController, loginController, refreshTokenController, resetPasswordController, googleLoginController, googleLoginByTokenController } from "../controllers/auth.controller";
import { optionalAuthMiddleware } from "../middelware/auth.middleware";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/signup", { preHandler: [optionalAuthMiddleware] }, signupController as any);
  app.post("/login", loginController);
  app.post("/google", googleLoginController);
  app.post("/google-login", googleLoginByTokenController);
  app.post("/refresh", refreshTokenController);
  app.post("/reset-password", resetPasswordController);
}
