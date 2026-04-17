import { FastifyRequest, FastifyReply } from "fastify";
import {
  createComplaintService,
  getComplaintsService,
  deleteComplaintService,
  addResponseToComplaintService,
  getStudentComplaintsService,
} from "../services/complaint.service";
import { NotificationService } from "../services/notification.service";
import { User, Admin, Complaint, Student } from "../models";

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

    // Trigger Notification
    try {
      const studentName = `${student.get('first_name') || ''} ${student.get('last_name') || ''}`.trim() || "A Student";
      const notifData = { type: "complaint", complaint_id: (complaint as any).id };

      // Admin la: "नवीन तक्रार आली"
      await NotificationService.sendToAdmins(
        client_id,
        "नवीन तक्रार आली",
        `${studentName} ने नवीन तक्रार नोंदवली: "${title}". कृपया तपासा.`,
        notifData,
        user_id
      );

      // Teacher la: "विद्यार्थ्याची तक्रार आली"
      await NotificationService.sendToAll(
        client_id,
        "विद्यार्थ्याची तक्रार आली",
        `${studentName} ने तक्रार नोंदवली: "${title}".`,
        notifData,
        user_id,
        'teacher'
      );

      // SuperAdmin la: "नवीन तक्रार आली"
      await NotificationService.sendToSuperAdmins(
        "नवीन तक्रार आली",
        `${studentName} ने नवीन तक्रार नोंदवली: "${title}".`,
        notifData
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

    // Trigger Notification — Student la reply notification
    try {
      const fullComplaint = await Complaint.findByPk(id, {
        include: [{ 
          model: Student, 
          as: "student",
          attributes: ["id", "user_id", "first_name", "last_name"]
        }]
      });

      const complaintAny = fullComplaint as any;
      const studentUserId = complaintAny?.student?.user_id;
      const complaintTitle = complaintAny?.title || 'तक्रार';

      if (studentUserId) {
        await NotificationService.sendToUser(
          studentUserId,
          "तक्रारीला उत्तर मिळाले ✅",
          `तुमच्या "${complaintTitle}" तक्रारीला उत्तर मिळाले. My Complaints मध्ये पाहा.`,
          { type: "complaint_response", complaint_id: id, sender_id: user_id }
        );
        console.log(`[Complaint Response] Notification sent to student user_id: ${studentUserId}`);
      } else {
        console.error(`[Complaint Response] student user_id not found for complaint ${id}. fullComplaint:`, JSON.stringify(complaintAny?.student));
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
