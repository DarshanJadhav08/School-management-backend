import { FastifyRequest, FastifyReply } from "fastify";
import { timetableService } from "../services/timetable.service";
import { NotificationService } from "../services/notification.service";

const timetableController = {
  async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { client_id } = req.params as any;
      const data = await timetableService.create(req.body, req.user, client_id);
      
      // Trigger Notification
      try {
        const { standard } = req.body as any;
        if (standard) {
          await NotificationService.sendToClass(
            client_id,
            standard,
            "Timetable Update Zala Ahe",
            `Tumchya vargacha (${standard}) timetable update kela ahe. Krupaya app madhe check kara.`,
            { type: "timetable_update" }
          );
        }
      } catch (notifyError) {
        console.error("Failed to send timetable notification:", notifyError);
      }

      return reply.status(201).send({ success: true, data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },

  async getById(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as any;
      const data = await timetableService.getById(id);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },

  async getByDay(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { client_id } = req.params as any;
      const { day, standard, division } = req.query as any;
      const data = await timetableService.getByDay(client_id, day, standard, division);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },

  async getByDate(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { client_id } = req.params as any;
      const { date, standard, division } = req.query as any;
      const data = await timetableService.getByDate(client_id, date, standard, division);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },

  async getAll(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { client_id } = req.params as any;
      const { standard, division } = req.query as any;
      const data = await timetableService.getAll(client_id, standard, division);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },

  async update(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as any;
      const data = await timetableService.update(id, req.body, req.user);
      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },

  async delete(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as any;
      const data = await timetableService.delete(id);
      return reply.send({ success: true, ...data });
    } catch (err: any) {
      return reply.status(err.statusCode || 500).send({ success: false, message: err.message });
    }
  },
};

export default timetableController;
