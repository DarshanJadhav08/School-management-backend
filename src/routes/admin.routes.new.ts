import { FastifyInstance } from "fastify";
import {
  addAdminController,
  getAllAdminsController,
  getAdminByIdController,
  getAdminProfileController,
  updateAdminController,
  deleteAdminController,
} from "../controllers/admin.controller.new";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  // Admin profile (for logged-in admin)
  app.get("/profile", getAdminProfileController);
  
  // Client-specific routes
  app.post("/:client_id/admins", addAdminController);
  app.get("/:client_id/admins", getAllAdminsController);
  app.get("/:client_id/admins/:admin_id", getAdminByIdController);
  app.put("/:client_id/admins/:admin_id", updateAdminController);
  app.delete("/:client_id/admins/:admin_id", deleteAdminController);
}
