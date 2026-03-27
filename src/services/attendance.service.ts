import {
  createAttendance,
  findAttendanceById,
  findAttendancesByClientId,
  findAttendancesByStudentId,
  findAttendancesByDate,
  updateAttendance,
  deleteAttendance,
  bulkCreateAttendances
} from "../repositories/attendance.repository";
import { Student, Teacher, Client, Attendance } from "../models";

export const createAttendanceService = async (data: {
  client_id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remark?: string;
}) => {
  const client = await Client.findByPk(data.client_id);
  if (!client) {
    const error: any = new Error("Client does not exist");
    error.statusCode = 404;
    throw error;
  }

  const student = await Student.findByPk(data.student_id);
  if (!student) {
    const error: any = new Error("Student does not exist");
    error.statusCode = 404;
    throw error;
  }

  const teacher = await Teacher.findOne({ where: { user_id: data.teacher_id } });
  if (!teacher) {
    const error: any = new Error("Teacher does not exist");
    error.statusCode = 404;
    throw error;
  }
  data.teacher_id = (teacher as any).id;

  return await createAttendance(data);
};

export const getAttendanceByIdService = async (id: string) => {
  const attendance = await findAttendanceById(id);
  if (!attendance) {
    const error: any = new Error("Attendance record not found");
    error.statusCode = 404;
    throw error;
  }
  return attendance;
};

export const getAttendancesByClientIdService = async (client_id: string) => {
  return await findAttendancesByClientId(client_id);
};

export const getAttendancesByStudentIdService = async (
  student_id: string,
  startDate?: string,
  endDate?: string
) => {
  return await findAttendancesByStudentId(student_id, startDate, endDate);
};

export const getAttendancesByDateService = async (client_id: string, date: string) => {
  return await findAttendancesByDate(client_id, date);
};

export const updateAttendanceService = async (
  id: string,
  data: {
    status?: 'Present' | 'Absent' | 'Late';
    remark?: string;
  }
) => {
  const attendance = await updateAttendance(id, data);
  if (!attendance) {
    const error: any = new Error("Attendance record not found");
    error.statusCode = 404;
    throw error;
  }
  return attendance;
};

export const deleteAttendanceService = async (id: string) => {
  const attendance = await deleteAttendance(id);
  if (!attendance) {
    const error: any = new Error("Attendance record not found");
    error.statusCode = 404;
    throw error;
  }
  return attendance;
};

export const bulkCreateAttendancesService = async (
  attendances: Array<{
    client_id: string;
    student_id: string;
    teacher_id: string;
    date: string;
    status: 'Present' | 'Absent' | 'Late';
    remark?: string;
  }>
) => {
  const teacher = await Teacher.findOne({ where: { user_id: attendances[0]?.teacher_id } });
  
  let actualTeacherId: string;
  
  if (!teacher) {
    // If not a teacher, try to find any teacher from the same client
    const anyTeacher = await Teacher.findOne({ where: { client_id: attendances[0]?.client_id } });
    if (!anyTeacher) {
      const error: any = new Error("No teacher found for this client");
      error.statusCode = 404;
      throw error;
    }
    actualTeacherId = (anyTeacher as any).id;
  } else {
    actualTeacherId = (teacher as any).id;
  }
  
  const attendancesWithTeacherId = attendances.map(att => ({
    ...att,
    teacher_id: actualTeacherId
  }));
  
  return await bulkCreateAttendances(attendancesWithTeacherId);
};

export const getAttendancesByClassService = async (
  client_id: string,
  standard: string,
  division?: string,
  date?: string
) => {
  const where: any = { client_id, standard };
  
  // Division ignore - always fetch all divisions
  
  const students = await Student.findAll({ where });
  const studentIds = students.map((s: any) => s.id);
  
  const attendanceWhere: any = {
    client_id,
    student_id: studentIds
  };
  
  if (date) {
    attendanceWhere.date = date;
  }
  
  return await Attendance.findAll({
    where: attendanceWhere,
    attributes: ['id', 'client_id', 'student_id', 'teacher_id', 'date', 'status', 'remark'],
    include: [
      { 
        model: Student, 
        as: 'student',
        attributes: ['id', 'first_name', 'middle_name', 'last_name', 'mobile_number', 'standard', 'division', 'gender']
      },
      { 
        model: Teacher, 
        as: 'teacher',
        attributes: ['id', 'first_name', 'middle_name', 'last_name']
      }
    ],
    order: [['date', 'DESC']]
  });

  
};

export const getStudentMonthlyAttendanceService = async (
  student_id: string,
  month: string,
  year: string
) => {
  // Month range create
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(Number(year), Number(month), 0)
    .toISOString()
    .split("T")[0];

  // Fetch records
  const attendances = await findAttendancesByStudentId(
    student_id,
    startDate,
    endDate
  );

  // Counts
const present = attendances.filter((a: any) => a.status === "Present").length;
const absent = attendances.filter((a: any) => a.status === "Absent").length;
const late = attendances.filter((a: any) => a.status === "Late").length;

  return {
    month,
    year,
    totalDays: attendances.length,
    present,
    absent,
    late,
    data: attendances
  };
};