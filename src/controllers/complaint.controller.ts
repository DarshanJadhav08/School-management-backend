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
    const { title, description, role, target_name, recipient_user_id } = req.body;
    const { user_id, client_id } = req.user;

    if (!title || !description || !role) {
      return reply.status(400).send({
        statusCode: 400,
        message: "Title, description, and role are required",
      });
    }

    const student = await Student.findOne({ where: { user_id } });
    if (!student) {
      return reply.status(404).send({ statusCode: 404, message: "Student not found" });
    }

    const complaint = await createComplaintService({
      student_id: student.id,
      client_id,
      title,
      description,
      role,
      target_name: target_name || null,
      recipient_user_id: recipient_user_id || null,
    });

    // Send notification to recipient(s)
    try {
      const studentName = `${student.get('first_name') || ''} ${student.get('last_name') || ''}`.trim() || "A Student";
      const notifData = { 
        type: "complaint", 
        complaint_id: (complaint as any).id,
        sender_id: user_id,
        student_id: student.id
      };
      const notifTitle = "नवीन तक्रार आली";
      const notifBody = `${studentName} ने तक्रार नोंदवली: "${title}"`;

      if (recipient_user_id) {
        // Specific admin/teacher को notification
        await NotificationService.sendToUser(recipient_user_id, notifTitle, notifBody, notifData);
      } else if (role?.toLowerCase() === 'teacher') {
        // सभी teachers को notification
        await NotificationService.sendToAll(client_id, notifTitle, notifBody, notifData, user_id, 'teacher');
      } else {
        // सभी admins को notification
        await NotificationService.sendToAdmins(client_id, notifTitle, notifBody, notifData, user_id);
      }
    } catch (notifyError) {
      console.error("Failed to send complaint notification:", notifyError);
    }

    return reply.status(201).send({
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
    const { client_id, user_id: reqUserId, role_name } = req.user;
    const { standard, role, student_name, user_id, student_id } = req.query;

    // Admin/Teacher la sirf unke complaints dikhao (recipient_user_id match)
    // Student la sirf unke complaints dikhao (student_id match)
    const complaints = await getComplaintsService(client_id, {
      standard,
      role,
      student_name,
      user_id: user_id || student_id,
      requester_user_id: reqUserId,
      requester_role: role_name,
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

    // Notification BEFORE reply.send() - Fastify terminates after send
    try {
      const fullComplaint = await Complaint.findByPk(id);
      const complaintAny = fullComplaint as any;
      const complaintTitle = complaintAny?.title || 'तक्रार';
      const studentId = complaintAny?.student_id;

      if (studentId) {
        const student = await Student.findByPk(studentId, {
          attributes: ['id', 'user_id']
        });
        const studentUserId = (student as any)?.user_id;

        console.log(`[Complaint Response] student_id=${studentId}, student_user_id=${studentUserId}`);

        if (studentUserId) {
          await NotificationService.sendToUser(
            studentUserId,
            "तक्रारीला उत्तर मिळाले ✅",
            `तुमच्या "${complaintTitle}" तक्रारीला उत्तर मिळाले. My Complaints मध्ये पाहा.`,
            { type: "complaint_response", complaint_id: id, sender_id: user_id }
          );
          console.log(`[Complaint Response] Notification sent to student: ${studentUserId}`);
        }
      }
    } catch (notifyError) {
      console.error("Failed to send complaint response notification:", notifyError);
    }

    return reply.send({
      message: "Response added successfully",
      data: complaint,
    });
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
