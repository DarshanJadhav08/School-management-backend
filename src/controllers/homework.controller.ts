import { FastifyRequest, FastifyReply } from "fastify";
import {
  addHomeworkService,
  getHomeworkService,
  updateHomeworkService,
  deleteHomeworkService,
} from "../services/homework.service";
import { Teacher } from "../models/teacher.model";
import { Student } from "../models/student.model";
import { NotificationService } from "../services/notification.service";
import { User } from "../models";

// ➕ Add Homework
export const addHomeworkController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params as any;
    const body = req.body as any;
    const userId = req.user?.user_id as string;
    const role_name = req.user?.role_name as string;
    
    // Only teachers can add homework
    if (role_name !== 'teacher') {
      return reply.status(403).send({ 
        error: "Access denied",
        message: "Only teachers can add homework. Please login as a teacher." 
      });
    }
    
    let teacherId = (req.user as any)?.teacher_id as string;

    // Find teacher by user_id
    if (!teacherId) {
      const teacher = await Teacher.findOne({ where: { user_id: userId } });
      if (!teacher) {
        return reply.status(404).send({ 
          error: "Teacher not found",
          message: "Teacher profile not found. Please contact admin." 
        });
      }
      teacherId = teacher.get("id") as string;
    }

    const homework = await addHomeworkService(
      { ...body, client_id },
      teacherId,
      userId
    );

    // Trigger Notification
    try {
      const teacherUser = await User.findByPk(userId);
      const teacherName = teacherUser ? `${teacherUser.first_name} ${teacherUser.last_name}` : "Teacher";
      
      await NotificationService.sendToClass(
        client_id,
        body.className || body.standard,
        "Naveen Homework Add Kele Ahe",
        `${teacherName} ne ${body.subjectName || 'Subject'} che homework add kele ahe, krupaya bgha!`,
        { type: "homework", homework_id: homework.id }
      );
    } catch (notifyError) {
      console.error("Failed to send homework notification:", notifyError);
    }

    return reply.status(201).send({
      message: "Homework added successfully",
      homework,
    });
  } catch (error: any) {
    console.error("Error in addHomeworkController:", error);
    return reply.status(500).send({
      error: "Failed to add homework",
      details: error.message,
    });
  }
};

export const getHomeworkController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params as any;
    const query = req.query as any;
    const user = req.user as any;

    console.log("=== GET HOMEWORK DEBUG ===");
    console.log("User Role:", user.role_name);
    console.log("User Role Type:", typeof user.role_name);
    console.log("User Role Lowercase:", user.role_name?.toLowerCase());
    console.log("User ID:", user.user_id);
    console.log("Client ID:", client_id);
    console.log("Full User Object:", JSON.stringify(user, null, 2));

    const filters: any = { client_id };

    if (user.role_name.toLowerCase() === "admin") {
      if (query.class_name) filters.className = query.class_name;
      if (query.homework_date) filters.date = query.homework_date;
      if (query.from_date) filters.fromDate = query.from_date;
      if (query.to_date) filters.toDate = query.to_date;
      if (query.subject_name) filters.subjectName = query.subject_name;
      if (query.page) filters.page = query.page;
      if (query.limit) filters.limit = query.limit;
    }

    else if (user.role_name.toLowerCase() === "teacher") {
      console.log("Teacher filters applied");
      // Teachers can see all homework with optional filters
      if (query.class_name) filters.className = query.class_name;
      if (query.homework_date) filters.date = query.homework_date;
      if (query.from_date) filters.fromDate = query.from_date;
      if (query.to_date) filters.toDate = query.to_date;
      if (query.subject_name) filters.subjectName = query.subject_name;
      if (query.page) filters.page = query.page;
      if (query.limit) filters.limit = query.limit;
    }

    else if (user.role_name.toLowerCase() === "student") {
      console.log("Student filters applied");
      // Get student's class
      const student = await Student.findOne({
        where: { user_id: user.user_id, client_id },
      });

      if (!student) {
        console.log("Student not found for user_id:", user.user_id, "client_id:", client_id);
        return reply.status(404).send({
          error: "Student not found",
          message: "Student profile not found for this client"
        });
      }

      const studentClass = student.get("standard");
      console.log("Student Class:", studentClass);
      console.log("Student Client ID:", student.get("client_id"));
      console.log("Student Data:", student.toJSON());

      // Always filter by student's own class (security)
      filters.className = studentClass;

      // Apply optional date filters
      if (query.homework_date) {
        filters.date = query.homework_date;
      } else if (query.from_date && query.to_date) {
        filters.fromDate = query.from_date;
        filters.toDate = query.to_date;
      }
      
      if (query.subject_name) filters.subjectName = query.subject_name;
      if (query.page) filters.page = query.page;
      if (query.limit) filters.limit = query.limit;
    }
    
    else {
      // Handle any other roles or fallback
      console.log("Unknown role, applying basic filters");
      if (query.class_name) filters.className = query.class_name;
      if (query.homework_date) filters.date = query.homework_date;
      if (query.from_date) filters.fromDate = query.from_date;
      if (query.to_date) filters.toDate = query.to_date;
      if (query.subject_name) filters.subjectName = query.subject_name;
      if (query.page) filters.page = query.page;
      if (query.limit) filters.limit = query.limit;
    }

    console.log("Final Filters:", filters);

    const result = await getHomeworkService(filters);

    console.log("Result Count:", result.pagination.total);
    console.log("=== END DEBUG ===");

    return reply.status(200).send(result);

  } catch (error: any) {
    console.error("Error in getHomeworkController:", error);
    return reply.status(500).send({
      error: "Failed to fetch homework",
      details: error.message,
    });
  }
};

// ✏ Update
export const updateHomeworkController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { homework_id } = req.params as any;
    const userId = req.user?.user_id as string;

    const homework = await updateHomeworkService(
      homework_id,
      req.body,
      userId
    );

    return reply.status(200).send({
      message: "Homework updated successfully",
      homework,
    });
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to update homework",
      details: error.message,
    });
  }
};

// ❌ Delete
export const deleteHomeworkController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { homework_id } = req.params as any;

    const result = await deleteHomeworkService(homework_id);

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(500).send({
      error: "Failed to delete homework",
      details: error.message,
    });
  }
};
