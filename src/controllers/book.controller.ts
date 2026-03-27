import { FastifyRequest, FastifyReply } from "fastify";
import {
  addBookService,
  getBooksService,
  updateBookService,
  deleteBookService,
} from "../services/book.service";
import { Student } from "../models/student.model";

export const addBookController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params as any;
    const body = req.body as any;
    const userId = req.user?.user_id as string;
    const userRole = (req.user as any)?.role_name?.toLowerCase();

    if (userRole !== "teacher" && userRole !== "admin") {
      return reply.status(403).send({ error: "Only teachers and admins can upload books" });
    }

    const book = await addBookService({ ...body, client_id }, userId);

    return reply.status(201).send({
      message: "Book uploaded successfully",
      book,
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to upload book",
      details: error.message,
    });
  }
};

export const getBooksController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params as any;
    const query = req.query as any;
    const user = req.user as any;

    console.log("=== GET BOOKS DEBUG ===");
    console.log("User Role:", user.role_name);
    console.log("User Client ID:", user.client_id);
    console.log("Param Client ID:", client_id);
    console.log("Query Params:", query);

    const filters: any = { client_id };

    // Both teacher and student can see all books
    if (query.class_name) filters.className = query.class_name;
    if (query.subject_name) filters.subjectName = query.subject_name;

    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;

    console.log("Final Filters:", filters);

    const result = await getBooksService(filters);

    console.log("Result Count:", result.pagination.total);
    console.log("=== END DEBUG ===");

    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in getBooksController:", error);
    return reply.status(500).send({
      error: "Failed to fetch books",
      details: error.message,
    });
  }
};

export const updateBookController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { book_id } = req.params as any;
    const userId = req.user?.user_id as string;

    const book = await updateBookService(book_id, req.body, userId);

    return reply.status(200).send({
      message: "Book updated successfully",
      book,
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to update book",
      details: error.message,
    });
  }
};

export const deleteBookController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { book_id } = req.params as any;
    const userRole = (req.user as any)?.role_name?.toLowerCase();

    if (userRole !== "teacher" && userRole !== "admin") {
      return reply.status(403).send({ error: "Only teachers and admins can delete books" });
    }

    const result = await deleteBookService(book_id);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to delete book",
      details: error.message,
    });
  }
};

export const getBooksByClassController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { client_id, class_name } = req.params as any;
    const query = req.query as any;

    const filters: any = {
      client_id,
      className: class_name,
    };

    if (query.subject_name) filters.subjectName = query.subject_name;
    if (query.page) filters.page = query.page;
    if (query.limit) filters.limit = query.limit;

    const result = await getBooksService(filters);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to fetch books",
      details: error.message,
    });
  }
};
