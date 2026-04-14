import { FastifyRequest, FastifyReply } from "fastify";
import { Notification } from "../models/notification.model";

export const getNotificationsController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = req.user?.user_id as string;
    const { page = 1, limit = 20 } = req.query as any;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    return reply.send({
      notifications: rows,
      pagination: {
        total: count,
        currentPage: Number(page),
        totalPages: Math.ceil(count / Number(limit)),
      }
    });
  } catch (error: any) {
    console.error("Error in getNotificationsController:", error);
    return reply.status(500).send({ error: "Failed to fetch notifications" });
  }
};

export const markAsReadController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as any;
    const userId = req.user?.user_id as string;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return reply.status(404).send({ error: "Notification not found" });
    }

    await notification.update({ is_read: true });

    return reply.send({ message: "Notification marked as read" });
  } catch (error: any) {
    return reply.status(500).send({ error: "Failed to update notification" });
  }
};
