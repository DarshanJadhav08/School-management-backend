import { FastifyRequest, FastifyReply } from "fastify";
import {
  createStudentService,
  getAllStudentsService,
  getStudentByIdService,
  getStudentProfileService,
  updateStudentService,
  deleteStudentService,
} from "../services/student.service";

export const createStudentController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { client_id } = req.params as any;
    const body = req.body as any;
    const studentData = { ...body, client_id };
    const userId = req.user?.user_id as string;
    const student = await createStudentService(studentData, userId);
    return reply.status(201).send({
      message: "Student created successfully",
      student,
    });
  } catch (error: any) {
    console.error("Error in createStudentController:", error);
    return reply.status(500).send({
      error: "Failed to create student",
      details: error.message,
    });
  }
};

export const getAllStudentsController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { client_id } = req.params as any;
    const query = req.query as any;
    const filters = { ...query, client_id };
    const result = await getAllStudentsService(filters);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in getAllStudentsController:", error);
    return reply.status(500).send({
      error: "Failed to fetch students",
      details: error.message,
    });
  }
};

export const getStudentByIdController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { student_id } = req.params as any;
    const student = await getStudentByIdService(student_id);
    if (!student) {
      return reply.status(404).send({
        error: "Student not found"
      });
    }
    return reply.status(200).send({
      message: "Student fetched successfully",
      student
    });
  } catch (error: any) {
    console.error("Error in getStudentByIdController:", error);
    return reply.status(500).send({
      error: "Failed to fetch student",
      details: error.message,
    });
  }
};

export const getStudentProfileController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user_id = req.user?.user_id as string;
    
    if (!user_id) {
      return reply.status(401).send({
        error: "Unauthorized",
        details: "User ID not found in token",
      });
    }
    
    const student = await getStudentProfileService(user_id);
    return reply.status(200).send({
      message: "Student profile fetched successfully",
      student
    });
  } catch (error: any) {
    console.error("Error in getStudentProfileController:", error);
    return reply.status(404).send({
      error: "Student profile not found",
      details: error.message,
    });
  }
};

export const updateStudentController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { student_id } = req.params as any;
    const userId = req.user?.user_id as string;
    const result = await updateStudentService(student_id, req.body, userId);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in updateStudentController:", error);
    return reply.status(500).send({
      error: "Failed to update student",
      details: error.message,
    });
  }
};

export const deleteStudentController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { student_id } = req.params as any;
    const result = await deleteStudentService(student_id);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in deleteStudentController:", error);
    return reply.status(500).send({
      error: "Failed to delete student",
      details: error.message,
    });
  }
};
