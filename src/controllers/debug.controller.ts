import { FastifyRequest, FastifyReply } from "fastify";
import { Student } from "../models/student.model";
import { Homework } from "../models/homework.model";

export const debugHomeworkController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params as any;
    const user = req.user as any;

    console.log("=== DEBUG HOMEWORK DATA ===");
    
    // 1. Check student data
    const student = await Student.findOne({
      where: { user_id: user.user_id, client_id },
    });

    console.log("Student found:", !!student);
    if (student) {
      console.log("Student standard:", student.get("standard"));
      console.log("Student client_id:", student.get("client_id"));
    }

    // 2. Check all homework for this client
    const allHomework = await Homework.findAll({
      where: { client_id },
      attributes: ['id', 'class_name', 'subject_name', 'client_id', 'homework_date']
    });

    console.log("Total homework for client:", allHomework.length);
    allHomework.forEach(hw => {
      console.log(`Homework: class=${hw.get('class_name')}, subject=${hw.get('subject_name')}, date=${hw.get('homework_date')}`);
    });

    // 3. Check homework for student's class
    let homeworkForStudentClass: any[] = [];
    if (student) {
      const studentClass = student.get("standard");
      homeworkForStudentClass = await Homework.findAll({
        where: { 
          client_id,
          class_name: studentClass 
        },
        attributes: ['id', 'class_name', 'subject_name', 'homework_date']
      });
      console.log(`Homework for student's class (${studentClass}):`, homeworkForStudentClass.length);
    }

    return reply.send({
      debug: {
        user_id: user.user_id,
        client_id,
        student_found: !!student,
        student_class: student ? student.get("standard") : null,
        student_client_id: student ? student.get("client_id") : null,
        total_homework_for_client: allHomework.length,
        homework_for_student_class: homeworkForStudentClass.length,
        all_homework_classes: allHomework.map(hw => hw.get('class_name')),
        student_class_homework: homeworkForStudentClass.map((hw: any) => ({
          class: hw.get('class_name'),
          subject: hw.get('subject_name'),
          date: hw.get('homework_date')
        }))
      }
    });

  } catch (error: any) {
    console.error("Debug error:", error);
    return reply.status(500).send({ error: error.message });
  }
};