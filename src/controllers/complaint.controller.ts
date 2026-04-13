import { FastifyRequest, FastifyReply } from "fastify";
import {
  createComplaintService,
  getComplaintsService,
  deleteComplaintService,
  addResponseToComplaintService,
  getStudentComplaintsService,
} from "../services/complaint.service";
import { NotificationService } from "../services/notification.service";
import { User, Admin } from "../models";

export const createComplaintController = async (req: any, reply: FastifyReply) => {
  try {
    const { title, description, role, target_name } = req.body;
    const { user_id, client_id } = req.user;

    if (!title || !description || !role) {
      return reply.status(400).send({
        statusCode: 400,
        message: "Title, description, and role are required",
      });
    }

    // Get student_id from user_id
    const { Student } = require("../models");
    const student = await Student.findOne({ where: { user_id } });
    
    if (!student) {
      return reply.status(404).send({
        statusCode: 404,
        message: "Student not found",
      });
    }

    const complaint = await createComplaintService({
      student_id: student.id,
      client_id,
      title,
      description,
      role,
      target_name: target_name || null,
    });

    // Trigger Notification for Admin
    try {
      const studentName = `${req.user?.first_name} ${req.user?.last_name}` || "A Student";
      await NotificationService.sendToAll(
        client_id,
        "Naveen Takrar (Complaint) Aali Ahe",
        `${studentName} ne ek naveen takrar file keli ahe: ${title}`,
        { type: "complaint", complaint_id: complaint.id }
      );
    } catch (notifyError) {
      console.error("Failed to send complaint notification:", notifyError);
    }

    reply.status(201).send({
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error: any) {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

export const getComplaintsController = async (req: any, reply: FastifyReply) => {
  try {
    const { client_id } = req.user;
    const { standard, role, student_name } = req.query;

    const complaints = await getComplaintsService(client_id, {
      standard,
      role,
      student_name,
    });

    reply.send({
      message: "Complaints fetched successfully",
      count: complaints.length,
      data: complaints,
    });
  } catch (error: any) {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

export const deleteComplaintController = async (req: any, reply: FastifyReply) => {
  try {
    const result = await deleteComplaintService(req.params.id);
    reply.send(result);
  } catch (error: any) {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

export const addResponseController = async (req: any, reply: FastifyReply) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const { user_id } = req.user;

    if (!response) {
      return reply.status(400).send({
        statusCode: 400,
        message: "Response is required",
      });
    }

    const complaint = await addResponseToComplaintService(id, response, user_id);
    reply.send({
      message: "Response added successfully",
      data: complaint,
    });

    // Trigger Notification for Student
    try {
      const { Complaint, Student } = require("../models");
      const fullComplaint = await Complaint.findByPk(id, { 
        include: [{ model: Student, as: "student" }] 
      });
      
      if (fullComplaint?.student?.user_id) {
        await NotificationService.sendToUser(
          fullComplaint.student.user_id,
          "Tumchya Takrarila Uttar Milele Ahe",
          `Admin ne tumchya '${fullComplaint.title || 'Complaint'}' var pratikriya dili ahe.`,
          { type: "complaint_response", complaint_id: id }
        );
      }
    } catch (notifyError) {
      console.error("Failed to send complaint response notification:", notifyError);
    }
  } catch (error: any) {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};

export const getStudentComplaintsController = async (req: any, reply: FastifyReply) => {
  try {
    const { user_id } = req.user;
    const { Student } = require("../models");
    const student = await Student.findOne({ where: { user_id } });

    if (!student) {
      return reply.status(404).send({
        statusCode: 404,
        message: "Student not found",
      });
    }

    const complaints = await getStudentComplaintsService(student.id);
    reply.send({
      message: "Complaints fetched successfully",
      count: complaints.length,
      data: complaints,
    });
  } catch (error: any) {
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      message: error.message,
    });
  }
};
