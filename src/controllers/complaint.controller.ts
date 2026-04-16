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

    // Trigger Notification — send to specific recipient (teacher/admin) or all admins
    try {
      // Student चे नाव DB मधून घ्या (req.user मध्ये first_name नसतो)
      const studentName = `${student.get('first_name') || ''} ${student.get('last_name') || ''}`.trim() || "A Student";
      const notifTitle = "New Complaint Submitted";
      const notifBody = `${studentName} has filed a new complaint: "${title}". Please review it in the app.`;
      const notifData = { type: "complaint", complaint_id: (complaint as any).id };

      // Flutter app recipient_user_id पाठवतो — specific teacher/admin ला पाठवा
      const recipientUserId = req.body.recipient_user_id || req.body.target_user_id;
      if (recipientUserId) {
        await NotificationService.sendToUser(recipientUserId, notifTitle, notifBody, notifData);
      } else {
        // Fallback: सगळ्या admins ला पाठवा
        await NotificationService.sendToAdmins(client_id, notifTitle, notifBody, notifData);
      }
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
          "Your Complaint Has Been Responded To",
          `The admin has replied to your complaint: "${fullComplaint.title || 'Complaint'}". Open the app to read the response.`,
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
