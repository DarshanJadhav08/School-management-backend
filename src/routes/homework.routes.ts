import { FastifyInstance } from "fastify";
import {
  addHomeworkController,
  getHomeworkController,
  updateHomeworkController,
  deleteHomeworkController,
} from "../controllers/homework.controller";
import { debugHomeworkController } from "../controllers/debug.controller";
import { authMiddleware } from "../middelware/auth.middleware";
import { adminMiddleware } from "../middelware/admin.middleware";

export default async function homeworkRoutes(app: FastifyInstance) {

  // 🐛 Debug endpoint
  app.get(
    "/:client_id/homework/debug",
    { preHandler: [authMiddleware] },
    debugHomeworkController
  );

  // ➕ Add Homework (Teacher)
  app.post(
    "/:client_id/homework",
    { preHandler: [authMiddleware] },
    addHomeworkController
  );

  // 📥 Single GET (Role Based: Teacher / Student / Admin)
  app.get(
    "/:client_id/homework",
    { preHandler: [authMiddleware] },
    getHomeworkController
  );

  // ✏ Update
  app.put(
    "/:client_id/homework/:homework_id",
    { preHandler: [authMiddleware] },
    updateHomeworkController
  );

  // ❌ Delete
  app.delete(
    "/:client_id/homework/:homework_id",
    { preHandler: [authMiddleware] },
    deleteHomeworkController
  );
}