import { FastifyInstance } from "fastify";
import {
  addBookController,
  getBooksController,
  updateBookController,
  deleteBookController,
} from "../controllers/book.controller";
import { uploadBookFileController } from "../controllers/upload.controller";
import { authMiddleware } from "../middelware/auth.middleware";

export default async function bookRoutes(app: FastifyInstance) {
  app.post(
    "/upload-file",
    { preHandler: [authMiddleware] },
    uploadBookFileController
  );

  app.post(
    "/:client_id/books",
    { preHandler: [authMiddleware] },
    addBookController
  );

  app.get(
    "/:client_id/books",
    { preHandler: [authMiddleware] },
    getBooksController
  );

  app.put(
    "/:client_id/books/:book_id",
    { preHandler: [authMiddleware] },
    updateBookController
  );

  app.delete(
    "/:client_id/books/:book_id",
    { preHandler: [authMiddleware] },
    deleteBookController
  );
}
