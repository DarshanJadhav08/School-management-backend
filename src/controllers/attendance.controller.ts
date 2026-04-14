import { FastifyRequest, FastifyReply } from "fastify";
import {
  createAttendanceService,
  getAttendanceByIdService,
  getAttendancesByClientIdService,
  getAttendancesByStudentIdService,
  getAttendancesByDateService,
  getAttendancesByClassService,
  updateAttendanceService,
  deleteAttendanceService,
  bulkCreateAttendancesService,
  getStudentMonthlyAttendanceService
} from "../services/attendance.service";
import { Attendance, User, Student } from "../models";
import { NotificationService } from "../services/notification.service";

interface CreateAttendanceBody {
  student_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remark?: string;
}

interface UpdateAttendanceBody {
  status?: 'Present' | 'Absent' | 'Late';
  remark?: string;
}

interface BulkCreateAttendanceBody {
  attendances: Array<{
    student_id: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late';
    remark?: string;
  }>;
}

export const createAttendanceController = async (req: any, reply: FastifyReply) => {
  try {
    const { student_id, date, status, remark } = req.body;
    const { user_id, client_id } = req.user!;
    
    const attendance = await createAttendanceService({
      client_id: client_id as string,
      student_id,
      teacher_id: user_id as string,
      date,
      status,
      remark
    });
    
    // Trigger Notification for single attendance
    try {
      if (status === 'Absent' || status === 'Late') {
        const student = await Student.findByPk(student_id);
        const title = status === 'Absent' ? "Attendance Alert: Marked Absent" : "Attendance Alert: Marked Late";
        await NotificationService.sendToUser(
          student?.get('user_id') as string,
          title,
          `Your attendance has been marked as '${status}' for today. Please contact your teacher if this is incorrect.`,
          { type: "attendance", status: status }
        );
      }
    } catch (notifyError) {
      console.error("Failed to send attendance notification:", notifyError);
    }
    
    reply.status(201).send({
      message: "Attendance created successfully",
      data: attendance
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message || "Failed to create attendance",
      error: error.name || "Error"
    });
  }
};

export const getAttendanceByIdController = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const attendance = await getAttendanceByIdService(req.params.id);
    reply.send({
      message: "Attendance fetched successfully",
      data: attendance
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const getAttendancesByClientIdController = async (
  req: FastifyRequest<{ Params: { client_id: string } }>,
  reply: FastifyReply
) => {
  try {
    const attendances = await getAttendancesByClientIdService(req.params.client_id);
    reply.send({
      message: "Attendances fetched successfully",
      count: attendances.length,
      data: attendances
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const getAttendancesByStudentIdController = async (
  req: FastifyRequest<{ 
    Params: { student_id: string };
    Querystring: { startDate?: string; endDate?: string }
  }>,
  reply: FastifyReply
) => {
  try {
    const { student_id } = req.params;
    const { startDate, endDate } = req.query;
    const attendances = await getAttendancesByStudentIdService(student_id, startDate, endDate);
    reply.send({
      message: "Attendances fetched successfully",
      count: attendances.length,
      data: attendances
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const getAttendancesByDateController = async (
  req: FastifyRequest<{ 
    Params: { client_id: string };
    Querystring: { date: string }
  }>,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params;
    const { date } = req.query;
    const attendances = await getAttendancesByDateService(client_id, date);
    reply.send({
      message: "Attendances fetched successfully",
      count: attendances.length,
      data: attendances
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const updateAttendanceController = async (req: any, reply: FastifyReply) => {
  try {
    const attendance = await updateAttendanceService(req.params.id, req.body);
    reply.send({
      message: "Attendance updated successfully",
      data: attendance
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const deleteAttendanceController = async (req: any, reply: FastifyReply) => {
  try {
    await deleteAttendanceService(req.params.id);
    reply.send({
      message: "Attendance deleted successfully"
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const getAttendancesByClassController = async (
  req: FastifyRequest<{ 
    Params: { client_id: string };
    Querystring: { standard: string; division?: string; date?: string }
  }>,
  reply: FastifyReply
) => {
  try {
    const { client_id } = req.params;
    const { standard, division, date } = req.query;
    
    if (!standard) {
      return reply.status(400).send({
        statusCode: 400,
        message: "Standard is required",
        error: "ValidationError"
      });
    }
    
    const attendances = await getAttendancesByClassService(client_id, standard, division, date);
    
    const presentCount = attendances.filter((a: any) => a.status === 'Present').length;
    const absentCount = attendances.filter((a: any) => a.status === 'Absent').length;
    const lateCount = attendances.filter((a: any) => a.status === 'Late').length;
    
    reply.send({
      message: "Attendances fetched successfully",
      total: attendances.length,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      data: attendances
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message,
      error: error.name || "Error"
    });
  }
};

export const bulkCreateAttendancesController = async (req: any, reply: FastifyReply) => {
  try {
    const { user_id, client_id } = req.user!;
    
    const attendancesWithAuth = req.body.attendances.map((att: any) => ({
      ...att,
      client_id: client_id as string,
      teacher_id: user_id as string
    }));
    
    const attendances = await bulkCreateAttendancesService(attendancesWithAuth);

    // Trigger Notification for class-wide attendance
    try {
      const date = req.body.attendances?.[0]?.date || new Date().toISOString().split('T')[0];
      let standard = req.body.class_name;
      
      if (!standard) {
        const studentsInBatch = await Student.findOne({ where: { id: req.body.attendances?.[0]?.student_id } });
        standard = studentsInBatch?.get('standard');
      }

      if (standard) {
        await NotificationService.sendToClass(
          client_id as string,
          standard as string,
          "Attendance Recorded",
          `Today's (${date}) attendance has been marked. Please open the app to check your attendance status.`,
          { type: "attendance_batch", date: date }
        );
      }
    } catch (notifyError) {
      console.error("Failed to send bulk attendance notification:", notifyError);
    }

    reply.status(201).send({
      message: "Attendances created successfully",
      count: attendances.length,
      data: attendances
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      message: error.message || "Failed to create attendances",
      error: error.name || "Error"
    });
  }
};


export const getStudentMonthlyAttendanceController = async (req: any, reply: any) => {
  try {
    const { student_id } = req.params;
    const { month, year } = req.query;

    if (!month || !year) {
      return reply.status(400).send({
        message: "Month and year are required"
      });
    }

    const data = await getStudentMonthlyAttendanceService(
      student_id,
      month,
      year
    );

    reply.send({
      message: "Monthly attendance fetched successfully",
      ...data
    });

  } catch (error: any) {
    reply.status(400).send({
      message: error.message
    });
  }
};

export const getAttendanceStatsByClientController = async (req: any, reply: FastifyReply) => {
  try {
    const client_id = req.user?.client_id;
    const { date } = req.query;
    
    if (!client_id) {
      return reply.status(400).send({ error: "Client ID is required" });
    }

    const whereClause: any = { client_id };
    if (date) {
      whereClause.date = date;
    }

    const totalCount = await Attendance.count({ where: whereClause });
    const presentCount = await Attendance.count({ where: { ...whereClause, status: 'Present' } });
    const absentCount = await Attendance.count({ where: { ...whereClause, status: 'Absent' } });

    reply.send({
      data: {
        total: totalCount,
        present: presentCount,
        absent: absentCount
      }
    });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};