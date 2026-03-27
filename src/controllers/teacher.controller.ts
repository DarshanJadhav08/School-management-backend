import { FastifyRequest, FastifyReply } from "fastify";
import {
  addTeacherService,
  getAllTeachersService,
  getTeacherByIdService,
  getTeacherProfileService,
  updateTeacherService,
  deleteTeacherService,
} from "../services/teacher.service";

export const addTeacherController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { client_id } = req.params as any;
    const body = req.body as any;
    const teacherData = { ...body, client_id };
    const userId = req.user?.user_id as string;
    const teacher = await addTeacherService(teacherData, userId);
    return reply.status(201).send({
      message: "Teacher added successfully",
      teacher,
    });
  } catch (error: any) {
    console.error("Error in addTeacherController:", error);
    return reply.status(500).send({
      error: "Failed to add teacher",
      details: error.message,
    });
  }
};

export const getAllTeachersController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { client_id } = req.params as any;
    const query = req.query as any;
    const filters = { ...query, client_id };
    const result = await getAllTeachersService(filters);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in getAllTeachersController:", error);
    return reply.status(500).send({
      error: "Failed to fetch teachers",
      details: error.message,
    });
  }
};

export const getTeacherByIdController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { teacher_id } = req.params as any;
    const teacher = await getTeacherByIdService(teacher_id);
    return reply.status(200).send({
      message: "Teacher fetched successfully",
      teacher
    });
  } catch (error: any) {
    console.error("Error in getTeacherByIdController:", error);
    return reply.status(404).send({
      error: "Teacher not found",
      details: error.message,
    });
  }
};

export const getTeacherProfileController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user_id = req.user?.user_id as string;
    
    if (!user_id) {
      return reply.status(401).send({
        error: "Unauthorized",
        details: "User ID not found in token",
      });
    }
    
    const teacher = await getTeacherProfileService(user_id);
    return reply.status(200).send({
      message: "Teacher profile fetched successfully",
      teacher
    });
  } catch (error: any) {
    console.error("Error in getTeacherProfileController:", error);
    return reply.status(404).send({
      error: "Teacher profile not found",
      details: error.message,
    });
  }
};

export const updateTeacherController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { teacher_id } = req.params as any;
    const userId = req.user?.user_id as string;
    const result = await updateTeacherService(teacher_id, req.body, userId);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in updateTeacherController:", error);
    return reply.status(500).send({
      error: "Failed to update teacher",
      details: error.message,
    });
  }
};

export const deleteTeacherController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { teacher_id } = req.params as any;
    const result = await deleteTeacherService(teacher_id);
    return reply.status(200).send(result);
  } catch (error: any) {
    console.error("Error in deleteTeacherController:", error);
    return reply.status(500).send({
      error: "Failed to delete teacher",
      details: error.message,
    });
  }
};
