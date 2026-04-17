import { FastifyRequest, FastifyReply } from "fastify";
import { Notification } from "../models/notification.model";
import { Op } from "sequelize";

export const getNotificationsController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = req.user?.user_id as string;
    const { page = 1, limit = 50 } = req.query as any;

    console.log(`[Notifications] Fetching for user_id: ${userId}`);

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Notification.findAndCountAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
    });

    console.log(`[Notifications] Found ${count} notifications for user_id: ${userId}`);

    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false },
    });

    return reply.send({
      notifications: rows,
      unread_count: unreadCount,
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

export const markAllAsReadController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = req.user?.user_id as string;

    await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );

    return reply.send({ message: "All notifications marked as read" });
  } catch (error: any) {
    return reply.status(500).send({ error: "Failed to mark all as read" });
  }
};

export const getUnreadCountController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = req.user?.user_id as string;

    const count = await Notification.count({
      where: { user_id: userId, is_read: false },
    });

    return reply.send({ unread_count: count });
  } catch (error: any) {
    return reply.status(500).send({ error: "Failed to fetch unread count" });
  }
};

export const deleteNotificationController = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as any;
    const userId = req.user?.user_id as string;

    const notification = await Notification.findOne({
      where: { id, user_id: userId }
    });

    if (!notification) {
      return reply.status(404).send({ error: "Notification not found" });
    }

    await notification.destroy();
    return reply.send({ message: "Notification deleted" });
  } catch (error: any) {
    return reply.status(500).send({ error: "Failed to delete notification" });
  }
};
