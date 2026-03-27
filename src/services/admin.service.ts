import bcrypt from "bcrypt";
import { User } from "../models/users.model";
import {
  createAdminRepo,
  findAllAdminsRepo,
  findAdminByIdRepo,
  updateAdminRepo,
  deleteAdminRepo,
  findAdminRoleRepo,
} from "../repositories/admin.repository";

export const addAdminService = async (adminData: any) => {
  const { first_name, last_name, mobile_number, password, designation, qualification, date_of_birth, experience, gender, profile_image_url, client_id } = adminData;

  if (!first_name || !mobile_number || !password || !client_id) {
    throw new Error("First name, mobile_number, password and client_id are required");
  }

  const existingUser = await User.findOne({ where: { phone: mobile_number } });
  if (existingUser) {
    throw new Error("Mobile number already exists");
  }

  const adminRole = await findAdminRoleRepo();
  if (!adminRole) {
    throw new Error("Admin role not found. Please create 'admin' role first.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    phone: mobile_number,
    password: hashedPassword,
    role_id: adminRole.id,
    role_name: "admin",
    client_id: client_id,
    is_active: true,
  });

  await createAdminRepo({
    user_id: user.id,
    client_id,
    first_name,
    middle_name: adminData.middle_name,
    last_name,
    designation,
    qualification,
    date_of_birth,
    experience,
    gender,
    mobile_number,
    profile_image_url,
    created_by: adminData.created_by || user.id,
  });

  return {
    user_id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    mobile_number: mobile_number,
    designation: designation || null,
    qualification: qualification || null,
  };
};

export const getAllAdminsService = async (filters: any) => {
  const { count, rows: admins } = await findAllAdminsRepo(filters);

  return {
    pagination: {
      total: count,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 10),
      totalPages: Math.ceil(count / Number(filters.limit || 10)),
    },
    admins,
  };
};

export const getAdminByIdService = async (adminId: string) => {
  const admin = await findAdminByIdRepo(adminId);
  if (!admin) {
    throw new Error("Admin not found");
  }
  return admin;
};

export const getAdminProfileService = async (user_id: string) => {
  const { Admin } = require("../models");
  const admin = await Admin.findOne({ 
    where: { user_id },
    include: [{
      model: User,
      as: "user",
      attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"]
    }]
  });
  
  if (!admin) {
    throw new Error("Admin profile not found");
  }
  return admin;
};

export const updateAdminService = async (adminId: string, updateData: any) => {
  const admin = await findAdminByIdRepo(adminId);
  if (!admin) {
    throw new Error("Admin not found");
  }

  // Update user table fields
  const user = await User.findByPk(admin.get("user_id") as string);
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

  // Update admin table fields
  const adminUpdates: any = { updated_by: updateData.updated_by || user?.id };
  if (updateData.first_name) adminUpdates.first_name = updateData.first_name;
  if (updateData.middle_name !== undefined) adminUpdates.middle_name = updateData.middle_name;
  if (updateData.last_name) adminUpdates.last_name = updateData.last_name;
  if (updateData.mobile_number) adminUpdates.mobile_number = updateData.mobile_number;
  if (updateData.designation) adminUpdates.designation = updateData.designation;
  if (updateData.qualification) adminUpdates.qualification = updateData.qualification;
  if (updateData.date_of_birth) adminUpdates.date_of_birth = updateData.date_of_birth;
  if (updateData.experience !== undefined) adminUpdates.experience = updateData.experience;
  if (updateData.gender) adminUpdates.gender = updateData.gender;
  if (updateData.profile_image_url) adminUpdates.profile_image_url = updateData.profile_image_url;

  await updateAdminRepo(adminId, adminUpdates);

  return { message: "Admin updated successfully" };
};

export const deleteAdminService = async (adminId: string) => {
  const result = await deleteAdminRepo(adminId);
  if (!result) {
    throw new Error("Admin not found");
  }

  return { message: "Admin deactivated successfully" };
};
