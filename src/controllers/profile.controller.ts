import { FastifyRequest, FastifyReply } from "fastify";
import { Student, Teacher, Admin, User } from "../models";

export const getUniversalProfileController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const user_id = req.user?.user_id as string;
    const role_name = req.user?.role_name as string;
    
    if (!user_id) {
      return reply.status(401).send({
        error: "Unauthorized",
        details: "User ID not found in token",
      });
    }

    let profile = null;
    
    // Check role and fetch appropriate profile
    if (role_name === 'student') {
      profile = await Student.findOne({ 
        where: { user_id },
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"]
        }]
      });
    } else if (role_name === 'teacher') {
      profile = await Teacher.findOne({ 
        where: { user_id },
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"]
        }]
      });
    } else if (role_name === 'admin') {
      profile = await Admin.findOne({ 
        where: { user_id },
        include: [{
          model: User,
          as: "user",
          attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"]
        }]
      });
    }

    if (!profile) {
      return reply.status(404).send({
        error: "Profile not found",
        details: `${role_name} profile not found`,
      });
    }

    return reply.status(200).send({
      message: "Profile fetched successfully",
      role: role_name,
      profile
    });
  } catch (error: any) {
    console.error("Error in getUniversalProfileController:", error);
    return reply.status(500).send({
      error: "Failed to fetch profile",
      details: error.message,
    });
  }
};
