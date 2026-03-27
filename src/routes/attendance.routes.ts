import { FastifyInstance } from "fastify";
import {
  createAttendanceController,
  getAttendanceByIdController,
  getAttendancesByClientIdController,
  getAttendancesByStudentIdController,
  getAttendancesByDateController,
  getAttendancesByClassController,
  updateAttendanceController,
  deleteAttendanceController,
  bulkCreateAttendancesController,
  getStudentMonthlyAttendanceController,
  getAttendanceStatsByClientController
} from "../controllers/attendance.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function attendanceRoutes(fastify: FastifyInstance) {
  fastify.post("/", { preHandler: [authMiddleware] }, createAttendanceController);
  fastify.post("/bulk", { preHandler: [authMiddleware] }, bulkCreateAttendancesController);
  fastify.get("/statistics", { preHandler: [authMiddleware] }, getAttendanceStatsByClientController);
  fastify.get("/:id", getAttendanceByIdController);
  fastify.get("/client/:client_id", getAttendancesByClientIdController);
  fastify.get("/client/:client_id/class", getAttendancesByClassController);
  fastify.get("/student/:student_id", getAttendancesByStudentIdController);
  fastify.get("/client/:client_id/date", getAttendancesByDateController);
  fastify.put("/:id", { preHandler: [authMiddleware] }, updateAttendanceController);
  fastify.delete("/:id", { preHandler: [authMiddleware] }, deleteAttendanceController);
  fastify.get(
  "/student/:student_id/month",
  getStudentMonthlyAttendanceController
);
}
