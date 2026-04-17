import { FastifyRequest, FastifyReply } from "fastify";
import { SchoolClassService } from "../services/schoolClass.service";

export class SchoolClassController {
  constructor(private service: SchoolClassService) {}

  addClass = async (request: FastifyRequest, reply: FastifyReply) => {
    const { client_id } = request.params as any;
    const body = request.body as any;
    const userId = request.user?.user_id as string;
    const data = { ...body, client_id, created_by: userId };
    const result = await this.service.addClass(data);
    if (!result) {
      return reply.status(400).send({ error: "Class already exists" });
    }
    reply.send(result);
  };

  addMultipleClasses = async (request: FastifyRequest, reply: FastifyReply) => {
    const { client_id } = request.params as any;
    const { class_names } = request.body as any;
    const userId = request.user?.user_id as string;
    const classes = class_names.map((name: string) => ({
      class_name: name,
      client_id,
      created_by: userId
    }));
    const result = await this.service.addMultipleClasses(classes);
    reply.send(result);
  };

  deleteClass = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const result = await this.service.deleteClass(id);
    reply.send(result);
  };

  updateClass = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const result = await this.service.updateClass(id, body);
    if (!result) return reply.status(404).send({ error: "Class not found" });
    reply.send(result);
  };

  getActiveClasses = async (request: FastifyRequest, reply: FastifyReply) => {
    const { client_id } = request.params as any;
    const result = await this.service.getActiveClasses(client_id);
    reply.send(result);
  };
}