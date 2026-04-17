import { Complaint, Student } from "../models";
import { Op } from "sequelize";

export const createComplaintService = async (data: {
  student_id: string;
  client_id: string;
  title: string;
  description: string;
  role: string;
  target_name?: string;
  recipient_user_id?: string;
}) => {
  const student = await Student.findByPk(data.student_id);
  if (!student) {
    const error: any = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  return await Complaint.create(data);
};

export const getComplaintsService = async (
  client_id: string,
  filters?: {
    standard?: string;
    role?: string;
    student_name?: string;
    user_id?: string;
    requester_user_id?: string;
    requester_role?: string;
  }
) => {
  const { User } = require("../models");
  const where: any = { client_id };

  // Role-based filtering
  const requesterRole = filters?.requester_role?.toLowerCase();
  if (requesterRole === 'admin' || requesterRole === 'teacher') {
    // Admin/Teacher la sirf unke liye aaye complaints (recipient_user_id match)
    if (filters?.requester_user_id) {
      where.recipient_user_id = filters.requester_user_id;
    }
  } else if (requesterRole === 'student') {
    // Student la sirf unke complaints (student_id match via include)
    // handled via student include filter below
  }

  // Additional filters
  if (filters?.role && requesterRole !== 'admin' && requesterRole !== 'teacher') {
    where.role = filters.role;
  }

  const include: any = [
    {
      model: Student,
      as: "student",
      attributes: ["id", "user_id", "first_name", "middle_name", "last_name", "standard", "division"],
      where: {},
    },
    {
      model: User,
      as: "responder",
      attributes: ["id", "first_name", "middle_name", "last_name"],
      required: false,
    },
  ];

  if (filters?.standard) {
    include[0].where.standard = filters.standard;
  }

  if (filters?.student_name) {
    include[0].where.first_name = { [Op.iLike]: `%${filters.student_name}%` };
  }

  // Student filter by user_id or student_id
  if (filters?.user_id && (requesterRole === 'student' || !requesterRole)) {
    include[0].where.user_id = filters.user_id;
  }

  return await Complaint.findAll({
    where,
    include,
    order: [["created_at", "DESC"]],
  });
};

export const deleteComplaintService = async (id: string) => {
  const complaint = await Complaint.findByPk(id);
  if (!complaint) {
    const error: any = new Error("Complaint not found");
    error.statusCode = 404;
    throw error;
  }

  await complaint.destroy();
  return { message: "Complaint deleted successfully" };
};

export const addResponseToComplaintService = async (
  id: string,
  response: string,
  user_id: string
) => {
  const { User } = require("../models");
  const complaint = await Complaint.findByPk(id);
  if (!complaint) {
    const error: any = new Error("Complaint not found");
    error.statusCode = 404;
    throw error;
  }

  await complaint.update({
    response,
    responded_by: user_id,
    responded_at: new Date(),
    status: 'resolved',
  });

  return await Complaint.findByPk(id, {
    include: [
      {
        model: User,
        as: "responder",
        attributes: ["id", "first_name", "middle_name", "last_name"],
      },
    ],
  });
};

export const getStudentComplaintsService = async (student_id: string) => {
  const { User } = require("../models");
  return await Complaint.findAll({
    where: { student_id },
    include: [
      {
        model: User,
        as: "responder",
        attributes: ["id", "first_name", "middle_name", "last_name"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });
};
