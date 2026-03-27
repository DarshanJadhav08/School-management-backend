import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "school_secret";

interface JwtPayload {
  user_id: string | number;
  role_id: string | number;
  role_name: string;
  client_id?: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export const authMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
  } catch (error) {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
};

export const optionalAuthMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }
};
