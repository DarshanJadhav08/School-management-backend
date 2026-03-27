import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUserWithRole, findUserByPhone, findUserByUniqueId } from "../repositories/auth.repository";
import { Role, Client, Student, Teacher, Admin } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "school_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "school_refresh_secret";

interface SignupData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  mobile_number: string;
  password: string;
  role_name: string;
  role_id?: string;
  client_id: string;
  // Student fields
  parent_name?: string;
  gender?: 'male' | 'female' | 'other';
  profile_image_url?: string;
  aadhar_number?: string;
  standard?: string;
  division?: string;
  admission_date?: Date;
  address?: string;
  category?: string;
  // Teacher fields
  date_of_birth?: Date;
  designation?: string;
  qualification?: string;
  joining_date?: Date;
  experience_years?: number;
  is_class_teacher?: boolean;
  assigned_standard?: string;
  assigned_division?: string;
  // Admin fields
  experience?: number;
}

const generateTokens = (userId: number | string, roleId: number | string, roleName: string, clientId?: string | null) => {
  const accessToken = jwt.sign(
    { 
      user_id: userId, 
      role_id: roleId,
      role_name: roleName,
      client_id: clientId 
    },
    JWT_SECRET,
    { expiresIn: "30d" } // 24h वरून 30d केले (30 दिवस)
  );

  const refreshToken = jwt.sign(
    { 
      user_id: userId, 
      role_id: roleId,
      role_name: roleName,
      client_id: clientId 
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "90d" } // 30d वरून 90d केले (90 दिवस)
  );

  return { accessToken, refreshToken };
};

export const signupService = async (data: SignupData, createdBy?: string) => {
  // Check role
  const role = await Role.findOne({ where: { name: data.role_name } });
  if (!role) {
    const error: any = new Error("Invalid role name");
    error.statusCode = 400;
    throw error;
  }

  // Check client
  if (data.client_id) {
    const client = await Client.findByPk(data.client_id);
    if (!client) {
      const error: any = new Error("Client does not exist");
      error.statusCode = 404;
      throw error;
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await createUserWithRole({
    ...data,
    password: hashedPassword,
    role_id: role.id,
    created_by: createdBy,
  });

  const tokens = generateTokens(user.id, user.role_id, user.role_name, user.client_id);

  return {
    user,
    unique_id: user.unique_id,
    ...tokens,
  };
};

export const loginService = async (uniqueIdOrPhone: string, password: string) => {
  if (!uniqueIdOrPhone) {
    throw new Error("Phone or unique ID is required");
  }

  let user = await findUserByUniqueId(uniqueIdOrPhone);
  
  if (!user) {
    user = await findUserByPhone(uniqueIdOrPhone);
  }

  if (!user) {
    throw new Error("User not found");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error("Invalid password");
  }

  const tokens = generateTokens(user.id, user.role_id, user.role_name, user.client_id);

  // Get role-specific ID
  let roleSpecificId = null;
  
  if (user.role_name === 'student') {
    const student = await Student.findOne({ where: { user_id: user.id } });
    roleSpecificId = (student as any)?.id;
  } else if (user.role_name === 'teacher') {
    const teacher = await Teacher.findOne({ where: { user_id: user.id } });
    roleSpecificId = (teacher as any)?.id;
  } else if (user.role_name === 'admin') {
    const admin = await Admin.findOne({ where: { user_id: user.id } });
    roleSpecificId = (admin as any)?.id;
  }

  const response: any = {
    ...tokens,
    user_id: user.id,
    role_id: user.role_id,
  };

  // Add role-specific ID
  if (roleSpecificId) {
    if (user.role_name === 'student') {
      response.student_id = roleSpecificId;
    } else if (user.role_name === 'teacher') {
      response.teacher_id = roleSpecificId;
    } else if (user.role_name === 'admin') {
      response.admin_id = roleSpecificId;
    }
  }

  return response;
};
