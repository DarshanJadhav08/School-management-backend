import bcrypt from "bcrypt";
import { User } from "../models/users.model";
import {
  createStudentRepo,
  findAllStudentsRepo,
  findStudentByIdRepo,
  updateStudentRepo,
  deleteStudentRepo,
  findStudentRoleRepo,
} from "../repositories/student.repository";

export const createStudentService = async (studentData: any, userId?: string) => {
  const { 
    name, 
    mobile_number,
    password, 
    roll_no, 
    class: className, 
    section, 
    parent_name, 
    parent_phone, 
    client_id,
    gender,
    profile_image_url,
    aadhar_number,
    admission_date,
    address,
    category
  } = studentData;

  if (!name || !mobile_number || !password || !client_id) {
    throw new Error("Name, mobile_number, password and client_id are required");
  }

  const studentRole = await findStudentRoleRepo();
  if (!studentRole) {
    throw new Error("Student role not found. Please create 'student' role first.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name: name,
    last_name: name,
    phone: mobile_number,
    password: hashedPassword,
    role_id: studentRole.id,
    role_name: "student",
    client_id: client_id,
    is_active: true,
  });

  await createStudentRepo({
    user_id: user.id,
    client_id,
    first_name: name,
    last_name: name,
    roll_no,
    class: className,
    section,
    parent_name,
    parent_phone,
    gender,
    mobile_number,
    profile_image_url,
    aadhar_number,
    admission_date,
    address,
    category,
    created_by: userId || user.id,
  });

  return {
    user_id: user.id,
    name: user.first_name,
    mobile_number: user.phone,
    roll_no,
    class: className,
    section,
    parent_name,
    parent_phone,
  };
};

export const getAllStudentsService = async (filters: any) => {
  const { count, rows: students } = await findAllStudentsRepo(filters);

  return {
    pagination: {
      total: count,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 10),
      totalPages: Math.ceil(count / Number(filters.limit || 10)),
    },
    students,
  };
};

export const getStudentByIdService = async (studentId: string) => {
  const student = await findStudentByIdRepo(studentId);
  return student;
};

export const getStudentProfileService = async (user_id: string) => {
  const { Student } = require("../models");

  const student = await Student.findOne({ 
    where: { user_id },
    attributes: [
      "id",
      "user_id",
      "client_id",
      "first_name",
      "middle_name",
      "last_name",
      "parent_name",
      "mobile_number",
      "date_of_birth",
      "roll_number",
      "gender",
      "profile_image_url",
      "aadhar_number",
      "standard",
      "division",
      "admission_date",
      "address",
      "category",
      "unique_id",
      "created_by",
      "created_on",
      "updated_by",
      "updated_on"
    ],
    include: [{
      model: User,
      as: "user",
      attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"]
    }]
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return student;
};

export const updateStudentService = async (studentId: string, updateData: any, userId?: string) => {
  const { sequelize } = require("../db/connection");
  const transaction = await sequelize.transaction();
  
  try {
    const student = await findStudentByIdRepo(studentId);
    if (!student) {
      await transaction.rollback();
      throw new Error("Student not found");
    }

    // Update user table fields
    const user = await User.findByPk(student.get("user_id") as string, { transaction });
    if (user) {
      const userUpdates: any = {};
      if (updateData.first_name) userUpdates.first_name = updateData.first_name;
      if (updateData.middle_name !== undefined) userUpdates.middle_name = updateData.middle_name;
      if (updateData.last_name) userUpdates.last_name = updateData.last_name;
      if (updateData.mobile_number) userUpdates.phone = updateData.mobile_number;
      if (updateData.is_active !== undefined) userUpdates.is_active = updateData.is_active;
      
      if (Object.keys(userUpdates).length > 0) {
        await user.update(userUpdates, { transaction });
      }
    }

    // Update student table fields
    const studentUpdates: any = { updated_by: userId };
    if (updateData.first_name) studentUpdates.first_name = updateData.first_name;
    if (updateData.middle_name !== undefined) studentUpdates.middle_name = updateData.middle_name;
    if (updateData.last_name) studentUpdates.last_name = updateData.last_name;
    if (updateData.parent_name) studentUpdates.parent_name = updateData.parent_name;
    if (updateData.mobile_number) studentUpdates.mobile_number = updateData.mobile_number;
    if (updateData.date_of_birth) studentUpdates.date_of_birth = updateData.date_of_birth;
    if (updateData.roll_number) studentUpdates.roll_number = updateData.roll_number;
    if (updateData.gender) studentUpdates.gender = updateData.gender;
    if (updateData.profile_image_url) studentUpdates.profile_image_url = updateData.profile_image_url;
    if (updateData.aadhar_number) studentUpdates.aadhar_number = updateData.aadhar_number;
    if (updateData.standard) studentUpdates.standard = updateData.standard;
    if (updateData.division) studentUpdates.division = updateData.division;
    if (updateData.admission_date) studentUpdates.admission_date = updateData.admission_date;
    if (updateData.address) studentUpdates.address = updateData.address;
    if (updateData.category) studentUpdates.category = updateData.category;

    await student.update(studentUpdates, { transaction });
    await transaction.commit();

    return { message: "Student updated successfully" };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const deleteStudentService = async (studentId: string) => {
  const result = await deleteStudentRepo(studentId);
  if (!result) {
    throw new Error("Student not found");
  }

  return { message: "Student deactivated successfully" };
};
