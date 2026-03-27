import { FastifyInstance } from 'fastify'
import {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice
} from '../controllers/notice.controller'
import { authMiddleware } from '../middelware/auth.middleware'

export default async function noticeRoutes(fastify: FastifyInstance) {

  fastify.post('/:client_id/notices', { preHandler: [authMiddleware] }, createNotice)

  fastify.get('/:client_id/notices', getAllNotices)

  fastify.get('/:client_id/notices/:id', getNoticeById)

  fastify.put('/:client_id/notices/:id', { preHandler: [authMiddleware] }, updateNotice)

  fastify.delete('/:client_id/notices/:id', { preHandler: [authMiddleware] }, deleteNotice)
}