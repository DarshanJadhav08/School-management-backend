import { FastifyRequest, FastifyReply } from 'fastify'
import { NoticeService } from '../services/notice.service'
import { NotificationService } from '../services/notification.service'
import { User } from '../models'

const service = new NoticeService()

export const createNotice = async (req: FastifyRequest, reply: FastifyReply) => {
  const userId = req.user?.user_id;
  const { client_id } = req.params as any;
  if (!userId) {
    return reply.status(401).send({ success: false, message: 'Unauthorized' });
  }
  const body = req.body as any;
  const noticeData = { ...body, created_by: userId, client_id, is_active: true };
  const result = await service.createNotice(noticeData);

  // Notification BEFORE reply.send()
  try {
    const creator = await User.findByPk(userId);
    const creatorRole = (creator?.role_name || 'admin').toLowerCase();
    const creatorName = creator ? `${creator.first_name} ${creator.last_name}`.trim() : "School";
    const notifData = { type: "notice", notice_id: result?.id };

    if (creatorRole === 'admin' || creatorRole === 'superadmin' || creatorRole === 'system admin') {
      await NotificationService.sendToAll(client_id, "नवीन सूचना आली", `${creatorName} ने नवीन सूचना प्रकाशित केली: ${body.title}.`, notifData, String(userId), 'teacher');
      await NotificationService.sendToAll(client_id, "नवीन सूचना आली", `${creatorName} ने नवीन सूचना प्रकाशित केली: ${body.title}.`, notifData, String(userId), 'student');
    } else if (creatorRole === 'teacher') {
      await NotificationService.sendToAll(client_id, "नवीन सूचना आली", `${creatorName} ने नवीन सूचना प्रकाशित केली: ${body.title}.`, notifData, String(userId), 'student');
      await NotificationService.sendToAdmins(client_id, "नवीन सूचना प्रकाशित", `${creatorName} ने नवीन सूचना प्रकाशित केली: ${body.title}.`, { ...notifData, sender_id: String(userId) }, String(userId));
    }
  } catch (notifyError) {
    console.error("Failed to send notice notification:", notifyError);
  }

  return reply.status(201).send({ success: true, data: result });
}

export const getAllNotices = async (req: FastifyRequest, reply: FastifyReply) => {
  const { client_id } = req.params as any;
  const { role, page = 1, limit = 10, class_name, date } = req.query as any;
  const result = await service.getAllNotices(client_id, role, Number(page), Number(limit), class_name, date);
  reply.send({ success: true, ...result });
}

export const getNoticeById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, client_id } = req.params as any;
    const result = await service.getNotice(id, client_id);
    reply.send({ success: true, data: result });
  } catch (err: any) {
    reply.status(404).send({ success: false, message: err.message });
  }
}

export const updateNotice = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id, client_id } = req.params as any;
    const userId = req.user?.user_id;
    if (!userId) {
      return reply.status(401).send({ success: false, message: 'Unauthorized' });
    }
    const body = req.body as any;
    const updateData = { ...body, updated_by: userId };
    const result = await service.updateNotice(id, updateData, client_id);
    reply.send({ success: true, data: result });
  } catch (err: any) {
    reply.status(404).send({ success: false, message: err.message });
  }
}

export const deleteNotice = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id, client_id } = req.params as any;
  await service.deleteNotice(id, client_id);
  reply.send({ success: true });
}