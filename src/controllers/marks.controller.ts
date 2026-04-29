import { FastifyRequest, FastifyReply } from "fastify";
import marksService from "../services/marks.service";
import { Student, User } from "../models";
import { NotificationService } from "../services/notification.service";

class MarksController {

  async saveOrUpdate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { first_name, roll_number, exam_name, subjects } = request.body as any;
      const result = await marksService.saveOrUpdate(request.body);
      
      // Return the saved data directly
      const savedSubjects = subjects.map((s: any) => ({
        subject_name: s.subject_name,
        marks_obtained: s.marks_obtained,
        total_marks: s.total_marks || 100,
        percentage: ((s.marks_obtained / (s.total_marks || 100)) * 100).toFixed(2)
      }));

      const totalObtained = subjects.reduce((sum: number, s: any) => sum + s.marks_obtained, 0);
      const totalMarks = subjects.reduce((sum: number, s: any) => sum + (s.total_marks || 100), 0);
      const overallPercentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : '0.00';

      // Trigger Notification — Student la marks notification
      try {
        const { Op } = require('sequelize');
        const clientId = (request.body as any).client_id;
        const whereClause: any = {
          roll_number: roll_number,
          first_name: { [Op.iLike]: first_name }
        };
        if (clientId) whereClause.client_id = clientId;

        const student = await Student.findOne({
          where: whereClause,
          attributes: ['id', 'user_id']
        });

        const studentUserId = (student as any)?.user_id;
        console.log(`[Marks] student found: ${student?.id}, user_id: ${studentUserId}`);

        if (studentUserId) {
          await NotificationService.sendToUser(
            studentUserId,
            "तुमचे गुण जोडले गेले ✅",
            `${exam_name || 'Exam'} चे गुण अपलोड केले. एकूण: ${overallPercentage}%. तपशील पाहण्यासाठी app उघडा.`,
            { type: "marks", exam_name: exam_name || 'Exam' }
          );
        }
      } catch (notifyError) {
        console.error("Failed to send marks notification:", notifyError);
      }

      return reply.send({
        ...result,
        marks: {
          first_name,
          roll_number,
          exam_name: exam_name || 'General',
          subjects: savedSubjects,
          summary: {
            total_obtained: totalObtained,
            total_marks: totalMarks,
            overall_percentage: overallPercentage
          }
        }
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getStudentMarks(request: FastifyRequest, reply: FastifyReply) {
    const { student_id, client_id, first_name, roll_number, exam_type, subject, standard } = request.query as any;
    
    // Support both old (first_name, roll_number) and new (student_id, client_id) approach
    if (first_name && roll_number) {
      // Old approach - find student by name and roll number
      const data = await marksService.getStudentMarksByName(first_name, roll_number);
      return reply.send(data);
    }
    
    if (!student_id || !client_id) {
      return reply.status(400).send({ error: "Either (first_name & roll_number) or (student_id & client_id) are required" });
    }
    
    // New approach - find by student_id
    const data = await marksService.getStudentMarks(student_id, client_id, { exam_type, subject, standard });
    return reply.send(data);
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const data = await marksService.getById(id);
    return reply.send(data);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as any;
    const result = await marksService.delete(id);
    return reply.send(result);
  }

  async deleteAllMarks(request: FastifyRequest, reply: FastifyReply) {
  const { first_name, roll_number } = request.body as any;

  const result = await marksService.deleteAllMarks(
    first_name,
    roll_number
  );

  return reply.send(result);
}

  async getAllExams(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { classes } = request.query as any;
      const exams = await marksService.getAllExams(classes);
      return reply.send({ exams });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async getToppersData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { classes } = request.query as any;
      
      if (!classes) {
        return reply.status(400).send({ error: 'Classes parameter is required' });
      }
      
      const marks = await marksService.getToppersData(classes);
      return reply.send({ marks });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

  async bulkSave(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await marksService.bulkSave(request.body);
      
      // Trigger Notification for class
      try {
        const { classes } = request.body as any;
        const { client_id } = request.params as any;
        if (classes) {
          await NotificationService.sendToClass(
            client_id,
            classes,
            "Exam Results Update Zale Ahet",
            `${classes} ya vargache naveen nikal (results) upload kelyat ahet.`,
            { type: "marks_bulk" }
          );
        }
      } catch (notifyError) {
        console.error("Failed to send bulk marks notification:", notifyError);
      }

      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }

}

export default new MarksController();
