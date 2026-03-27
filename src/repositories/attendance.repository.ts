import { Attendance, Student, Teacher } from "../models";
import { Op } from "sequelize";

export const createAttendance = async (data: {
  client_id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remark?: string;
}) => {
  const existing = await Attendance.findOne({
    where: {
      student_id: data.student_id,
      date: data.date
    }
  });
  
  if (existing) {
    throw new Error("Attendance already exists for this student on this date");
  }
  
  return await Attendance.create(data);
};

export const findAttendanceById = async (id: string) => {
  return await Attendance.findByPk(id, {
    include: [
      { model: Student, as: 'student' },
      { model: Teacher, as: 'teacher' }
    ]
  });
};

export const findAttendancesByClientId = async (client_id: string) => {
  return await Attendance.findAll({
    where: { client_id },
    include: [
      { model: Student, as: 'student' },
      { model: Teacher, as: 'teacher' }
    ],
    order: [['date', 'DESC']]
  });
};

export const findAttendancesByStudentId = async (student_id: string, startDate?: string, endDate?: string) => {
  const where: any = { student_id };
  
  if (startDate && endDate) {
    where.date = { [Op.between]: [startDate, endDate] };
  }
  
  return await Attendance.findAll({
    where,
    include: [{ model: Teacher, as: 'teacher' }],
    order: [['date', 'DESC']]
  });
};

export const findAttendancesByDate = async (client_id: string, date: string) => {
  return await Attendance.findAll({
    where: { client_id, date },
    include: [
      { model: Student, as: 'student' },
      { model: Teacher, as: 'teacher' }
    ]
  });
};

export const updateAttendance = async (id: string, data: {
  status?: 'Present' | 'Absent' | 'Late';
  remark?: string;
}) => {
  const attendance = await Attendance.findByPk(id);
  if (!attendance) return null;
  
  return await attendance.update(data);
};

export const deleteAttendance = async (id: string) => {
  const attendance = await Attendance.findByPk(id);
  if (!attendance) return null;
  
  await attendance.destroy();
  return attendance;
};

export const bulkCreateAttendances = async (attendances: Array<{
  client_id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  remark?: string;
}>) => {
  const studentIds = attendances.map(a => a.student_id);
  const dates = [...new Set(attendances.map(a => a.date))];
  
  const existing = await Attendance.findAll({
    where: {
      student_id: { [Op.in]: studentIds },
      date: { [Op.in]: dates }
    }
  });
  
  const existingMap = new Set(
    existing.map((a: any) => `${a.student_id}_${a.date}`)
  );
  
  const newAttendances = attendances.filter(
    a => !existingMap.has(`${a.student_id}_${a.date}`)
  );
  
  if (newAttendances.length === 0) {
    throw new Error("All attendance records already exist for the given students and dates");
  }
  
  return await Attendance.bulkCreate(newAttendances);
};
