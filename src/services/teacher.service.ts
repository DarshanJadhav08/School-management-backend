import bcrypt from "bcrypt";
import { User } from "../models/users.model";
import {
  createTeacherRepo,
  findAllTeachersRepo,
  findTeacherByIdRepo,
  updateTeacherRepo,
  deleteTeacherRepo,
  findTeacherRoleRepo,
} from "../repositories/teacher.repository";

export const addTeacherService = async (teacherData: any, userId?: string) => {
  const { 
    first_name, 
    middle_name,
    last_name, 
    phone, 
    role_name, 
    password, 
    subject, 
    qualification, 
    client_id,
    date_of_birth,
    gender,
    profile_image_url,
    mobile_number,
    designation,
    joining_date,
    experience_years,
    is_class_teacher,
    assigned_standard,
    assigned_division
  } = teacherData;

  if (!first_name || !phone || !password || !client_id) {
    throw new Error("Name, phone, password and client_id are required");
  }

  const existingUser = await User.findOne({ where: { phone } });
  if (existingUser) {
    throw new Error("Phone number already exists");
  }

  const teacherRole = await findTeacherRoleRepo();
  if (!teacherRole) {
    throw new Error("Teacher role not found. Please create 'teacher' role first.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    middle_name,
    last_name,
    phone,
    role_name: "teacher",
    password: hashedPassword,
    role_id: teacherRole.id,
    client_id: client_id,
  });

  await createTeacherRepo({
    user_id: user.id,
    client_id,
    first_name,
    middle_name,
    last_name,
    subject,
    qualification,
    date_of_birth,
    gender,
    profile_image_url,
    mobile_number,
    designation,
    joining_date,
    experience_years,
    is_class_teacher,
    assigned_standard,
    assigned_division,
    created_by: userId || user.id,
  });

  return {
    user_id: user.id,
    name: `${user.first_name} ${user.last_name || ''}`.trim(),
    phone: user.phone,
    subject: subject || null,
    qualification: qualification || null,
  };
};

export const getAllTeachersService = async (filters: any) => {
  const { count, rows: teachers } = await findAllTeachersRepo(filters);

  return {
    pagination: {
      total: count,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 10),
      totalPages: Math.ceil(count / Number(filters.limit || 10)),
    },
    teachers,
  };
};

export const getTeacherByIdService = async (teacherId: string) => {
  const teacher = await findTeacherByIdRepo(teacherId);
  if (!teacher) {
    throw new Error("Teacher not found");
  }
  return teacher;
};

export const getTeacherProfileService = async (user_id: string) => {
  const { Teacher } = require("../models");
  
  console.log("🔍 Searching for teacher with user_id:", user_id);
  
  const teacher = await Teacher.findOne({ 
    where: { user_id },
    include: [{
      model: User,
      as: "user",
      attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"]
    }]
  });
  
  console.log("✅ Teacher found:", teacher ? "YES" : "NO");
  if (teacher) {
    console.log("📋 Teacher data:", JSON.stringify(teacher, null, 2));
  } else {
    console.log("❌ No teacher record in database for user_id:", user_id);
    
    // Check if user exists
    const user = await User.findByPk(user_id);
    console.log("👤 User exists:", user ? "YES" : "NO");
    if (user) {
      console.log("👤 User role:", (user as any).role_name);
    }
  }
  
  if (!teacher) {
    throw new Error("Teacher profile not found");
  }
  return teacher;
};

export const updateTeacherService = async (teacherId: string, updateData: any, userId?: string) => {
  const teacher = await findTeacherByIdRepo(teacherId);
  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // Update user table fields
  const user = await User.findByPk(teacher.get("user_id") as string);
  if (user) {
    const userUpdates: any = {};
    if (updateData.first_name) userUpdates.first_name = updateData.first_name;
    if (updateData.middle_name !== undefined) userUpdates.middle_name = updateData.middle_name;
    if (updateData.last_name) userUpdates.last_name = updateData.last_name;
    if (updateData.mobile_number) userUpdates.phone = updateData.mobile_number;
    if (updateData.is_active !== undefined) userUpdates.is_active = updateData.is_active;
    
    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates);
    }
  }

  // Update teacher table fields
  const teacherUpdates: any = { updated_by: userId };
  if (updateData.first_name) teacherUpdates.first_name = updateData.first_name;
  if (updateData.middle_name !== undefined) teacherUpdates.middle_name = updateData.middle_name;
  if (updateData.last_name) teacherUpdates.last_name = updateData.last_name;
  if (updateData.mobile_number) teacherUpdates.mobile_number = updateData.mobile_number;
  if (updateData.date_of_birth) teacherUpdates.date_of_birth = updateData.date_of_birth;
  if (updateData.gender) teacherUpdates.gender = updateData.gender;
  if (updateData.profile_image_url) teacherUpdates.profile_image_url = updateData.profile_image_url;
  if (updateData.designation) teacherUpdates.designation = updateData.designation;
  if (updateData.qualification) teacherUpdates.qualification = updateData.qualification;
  if (updateData.joining_date) teacherUpdates.joining_date = updateData.joining_date;
  if (updateData.experience_years !== undefined) teacherUpdates.experience_years = updateData.experience_years;
  if (updateData.is_class_teacher !== undefined) teacherUpdates.is_class_teacher = updateData.is_class_teacher;
  if (updateData.assigned_standard) teacherUpdates.assigned_standard = updateData.assigned_standard;
  if (updateData.assigned_division) teacherUpdates.assigned_division = updateData.assigned_division;

  await updateTeacherRepo(teacherId, teacherUpdates);

  return { message: "Teacher updated successfully" };
};

export const deleteTeacherService = async (teacherId: string) => {
  const result = await deleteTeacherRepo(teacherId);
  if (!result) {
    throw new Error("Teacher not found");
  }

  return { message: "Teacher deactivated successfully" };
};
