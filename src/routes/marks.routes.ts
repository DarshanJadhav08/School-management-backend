import { FastifyInstance } from "fastify";
import marksController from "../controllers/marks.controller";

export default async function marksRoutes(fastify: FastifyInstance) {

  fastify.post("/save", marksController.saveOrUpdate);

  fastify.post("/bulk-save", marksController.bulkSave);

  fastify.get("/student", marksController.getStudentMarks);

  fastify.get("/exams/:client_id", marksController.getAllExams);

  fastify.get("/toppers/:client_id", marksController.getToppersData);

  fastify.get("/:id", marksController.getById);

  fastify.delete("/:id", marksController.delete);

  fastify.delete("/student", marksController.deleteAllMarks);

}
