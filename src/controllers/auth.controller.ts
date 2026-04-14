import { FastifyRequest, FastifyReply } from "fastify";
import { signupService, loginService } from "../services/auth.service";
import { refreshTokenService } from "../services/token.service";
import { findUserByPhone } from "../repositories/auth.repository";
import bcrypt from "bcrypt";

interface SignupBody {
  first_name: string;
  middle_name?: string;
  last_name: string;
  mobile_number: string;
  password: string;
  role_name: string;
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

interface LoginBody {
  uniqueIdOrPhone: string;
  password: string;
  fcmToken?: string;
}

interface RefreshTokenBody {
  refreshToken: string;
}

interface ResetPasswordBody {
  phone: string;
  newPassword: string;
}

export const signupController = async (req: FastifyRequest<{ Body: SignupBody }>, reply: FastifyReply) => {
  try {
    const { role_name } = req.body;
    
    // Check if role is superadmin - no token required
    if (role_name !== 'superadmin') {
      // For other roles, token is required
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply.status(401).send({ 
          statusCode: 401,
          message: "Access token required for this role",
          error: "Unauthorized"
        });
      }
    }
    
    const createdBy = req.user?.user_id as string | undefined;
    const result = await signupService(req.body, createdBy);
    reply.send({
      message: "User created successfully",
      user_id: result.user.id,
      unique_id: result.unique_id,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({ 
      statusCode,
      message: error.message || "Signup failed",
      error: error.name || "ValidationError"
    });
  }
};

export const loginController = async (req: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
  try {
    const { uniqueIdOrPhone, password, fcmToken } = req.body;

    const result = await loginService(uniqueIdOrPhone, password, fcmToken);

    reply.send({
      message: "Login successful",
      ...result
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      error: statusCode === 404 ? "Not Found" : statusCode === 401 ? "Unauthorized" : "Bad Request",
      message: error.message
    });
  }
};

export const refreshTokenController = async (req: FastifyRequest<{ Body: RefreshTokenBody }>, reply: FastifyReply) => {
  try {
    const { refreshToken } = req.body;
    const result = await refreshTokenService(refreshToken);
    reply.send(result);
  } catch (error: any) {
    reply.status(401).send({ error: error.message });
  }
};

export const resetPasswordController = async (req: FastifyRequest<{ Body: ResetPasswordBody }>, reply: FastifyReply) => {
  try {
    const { phone, newPassword } = req.body;
    
    if (!phone || !newPassword) {
      return reply.status(400).send({ error: "Phone and new password are required" });
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    reply.send({ message: "Password reset successfully" });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
