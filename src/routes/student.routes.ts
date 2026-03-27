import { FastifyInstance } from "fastify";
import {
  createStudentController,
  getAllStudentsController,
  getStudentByIdController,
  getStudentProfileController,
  updateStudentController,
  deleteStudentController,
} from "../controllers/student.controller";
import { authMiddleware } from "../middelware/auth.middleware";
import { adminMiddleware } from "../middelware/admin.middleware";

export default async function studentRoutes(app: FastifyInstance) {
  // Student profile (for logged-in student)
  app.get("/profile", { preHandler: [authMiddleware] }, getStudentProfileController);
  
  // Client-specific routes
  app.post("/:client_id/students", createStudentController);
  app.get("/:client_id/students", getAllStudentsController);
  app.get("/:client_id/students/:student_id", getStudentByIdController);
  app.put("/:client_id/students/:student_id", updateStudentController);
  app.delete("/:client_id/students/:student_id", deleteStudentController);
}
