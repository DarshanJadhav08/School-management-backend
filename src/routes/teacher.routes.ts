import { FastifyInstance } from "fastify";
import {
  addTeacherController,
  getAllTeachersController,
  getTeacherByIdController,
  getTeacherProfileController,
  updateTeacherController,
  deleteTeacherController,
} from "../controllers/teacher.controller";
import { authMiddleware } from "../middelware/auth.middleware";
import { adminMiddleware } from "../middelware/admin.middleware";

export default async function teacherRoutes(app: FastifyInstance) {
  // IMPORTANT: Specific routes MUST come before parameterized routes
  // Teacher profile (for logged-in teacher) - MUST BE FIRST
  app.get("/profile", { preHandler: [authMiddleware] }, getTeacherProfileController);
  
  // POST, PUT, DELETE - Admin only
  app.post("/:client_id/teachers", { preHandler: [authMiddleware, adminMiddleware] }, addTeacherController);
  app.put("/:client_id/teachers/:teacher_id", { preHandler: [authMiddleware, adminMiddleware] }, updateTeacherController);
  app.delete("/:client_id/teachers/:teacher_id", { preHandler: [authMiddleware, adminMiddleware] }, deleteTeacherController);
  
  // GET - Auth only (teacher can view)
  app.get("/:client_id/teachers", { preHandler: [authMiddleware] }, getAllTeachersController);
  app.get("/:client_id/teachers/:teacher_id", { preHandler: [authMiddleware] }, getTeacherByIdController);
}
