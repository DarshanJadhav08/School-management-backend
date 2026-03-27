import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "../models/role.model";

export const adminMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!req.user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const role = await Role.findByPk(req.user.role_id);
    
    if (!role || role.name !== "admin") {
      return reply.status(403).send({ error: "Access denied. Admin only." });
    }
  } catch (error) {
    return reply.status(500).send({ error: "Authorization check failed" });
  }
};
