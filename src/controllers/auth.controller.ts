import { FastifyRequest, FastifyReply } from "fastify";
import { signupService, loginService, googleLoginService, googleLoginByTokenService } from "../services/auth.service";
import { refreshTokenService } from "../services/token.service";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface SignupBody {
  first_name: string;
  middle_name?: string;
  last_name: string;
  mobile_number: string;
  password: string;
  role_name: string;
  client_id: string;
  email?: string;
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
  device_name?: string;
  device_platform?: string;
  device_id?: string;
  login_time?: string;
}

interface GoogleLoginBody {
  idToken: string;
  fcmToken?: string;
  device_name?: string;
  device_platform?: string;
  device_id?: string;
  login_time?: string;
}

interface RefreshTokenBody {
  refreshToken: string;
}

interface ForgotPasswordBody {
  user_id: string;
}

interface ResetPasswordBody {
  token: string;
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
    const { uniqueIdOrPhone, password, fcmToken, device_name, device_platform, login_time, device_id } = req.body;

    const result = await loginService(uniqueIdOrPhone, password, fcmToken, device_name, device_platform, login_time, device_id);

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

export const googleLoginController = async (req: FastifyRequest<{ Body: GoogleLoginBody }>, reply: FastifyReply) => {
  try {
    const { idToken, fcmToken, device_name, device_platform, login_time, device_id } = req.body;

    const result = await googleLoginService(idToken, fcmToken, device_name, device_platform, login_time, device_id);

    reply.send({
      message: "Login successful",
      ...result
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      error: statusCode === 403 ? "Forbidden" : statusCode === 401 ? "Unauthorized" : "Bad Request",
      message: error.message
    });
  }
};

interface GoogleLoginByTokenBody {
  accessToken: string;
  email: string;
  name: string;
  photo: string;
  fcmToken?: string;
  device_name?: string;
  device_platform?: string;
  device_id?: string;
  login_time?: string;
}

export const googleLoginByTokenController = async (req: FastifyRequest<{ Body: GoogleLoginByTokenBody }>, reply: FastifyReply) => {
  try {
    const { accessToken, email, name, photo, fcmToken, device_name, device_platform, login_time, device_id } = req.body;

    const result = await googleLoginByTokenService(
      accessToken,
      email,
      name,
      photo,
      fcmToken,
      device_name,
      device_platform,
      login_time,
      device_id
    );

    reply.send({
      message: "Login successful",
      ...result
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    reply.status(statusCode).send({
      statusCode,
      error: statusCode === 403 ? "Forbidden" : statusCode === 401 ? "Unauthorized" : "Bad Request",
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

export const forgotPasswordController = async (req: FastifyRequest<{ Body: ForgotPasswordBody }>, reply: FastifyReply) => {
  try {
    const { user_id } = req.body;
    const requester = req.user!;

    if (!user_id) {
      return reply.status(400).send({ error: "user_id is required" });
    }

    const { User } = await import("../models");
    const targetUser = await User.findByPk(user_id);
    if (!targetUser) {
      return reply.status(404).send({ error: "User not found" });
    }

    const requesterRole = requester.role_name;
    const targetRole = targetUser.role_name;

    const allowed =
      (requesterRole === "admin" && ["teacher", "student"].includes(targetRole) && requester.client_id === targetUser.client_id) ||
      (requesterRole === "superadmin" && ["admin", "superadmin"].includes(targetRole));

    if (!allowed) {
      return reply.status(403).send({ error: "You are not allowed to reset this user's password" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "school_secret";
    const token = jwt.sign({ user_id: targetUser.id, purpose: "password_reset" }, JWT_SECRET, { expiresIn: "30m" });

    reply.send({
      message: "Password reset token generated",
      reset_token: token,
      expires_in: "30 minutes",
    });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

export const resetPasswordController = async (req: FastifyRequest<{ Body: ResetPasswordBody }>, reply: FastifyReply) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return reply.status(400).send({ error: "token and newPassword are required" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "school_secret";
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch {
      return reply.status(400).send({ error: "Invalid or expired token" });
    }

    if (payload.purpose !== "password_reset") {
      return reply.status(400).send({ error: "Invalid token" });
    }

    const { User } = await import("../models");
    const user = await User.findByPk(payload.user_id);
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
