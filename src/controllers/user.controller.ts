import { FastifyRequest, FastifyReply } from "fastify";
import { User, Student, Teacher, Admin, Client } from "../models";
import { Op } from "sequelize";

interface UserParams {
  id: string;
}

interface UpdateUserBody {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
}

// Get all users
export const getAllUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    reply.send({ data: users });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Get user by ID
export const getUserById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as UserParams;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    reply.send({ data: user });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Update user
export const updateUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as UserParams;
    const body = req.body as UpdateUserBody;
    
    const user = await User.findByPk(id);

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    await user.update(body);

    reply.send({ message: "User updated successfully", data: user });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Delete user
export const deleteUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as UserParams;
    const user = await User.findByPk(id);

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    await user.destroy();

    reply.send({ message: "User deleted successfully" });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Get user statistics
export const getUserStatistics = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const client_id = req.user?.client_id;
    
    if (!client_id) {
      return reply.status(400).send({ error: "Client ID is required" });
    }

    const studentCount = await User.count({ where: { role_name: "student", client_id } });
    const teacherCount = await User.count({ where: { role_name: "teacher", client_id } });
    const adminCount = await User.count({ where: { role_name: "admin", client_id } });

    reply.send({
      data: {
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
        total: studentCount + teacherCount + adminCount
      }
    });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};

// Get all statistics (students, teachers, admins, clients)
export const getAllStatistics = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const studentsCount = await Student.count();
    const teachersCount = await Teacher.count();
    const adminsCount = await Admin.count();
    const clientsCount = await Client.count();
    const staffCount = teachersCount + adminsCount;

    reply.send({
      data: {
        students: studentsCount,
        staff: staffCount,
        clients: clientsCount,
        total: studentsCount + staffCount
      }
    });
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
};
