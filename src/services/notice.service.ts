import { NoticeRepository } from '../repositories/notice.repository'
import { NoticeAttributes } from '../interface/notice.interface'

export class NoticeService {

  private repo = new NoticeRepository()

  async createNotice(data: NoticeAttributes) {
    return await this.repo.create(data)
  }

  async getAllNotices(client_id: string, role?: string, page?: number, limit?: number, class_name?: string, date?: string) {
    return await this.repo.findAll(client_id, role, page, limit, class_name, date);
  }

  async getNotice(id: string, client_id: string) {
    const notice = await this.repo.findById(id, client_id);
    if (!notice) throw new Error('Notice Not Found');
    return notice;
  }

  async updateNotice(id: string, data: Partial<NoticeAttributes>, client_id: string) {
    const updated = await this.repo.update(id, data, client_id);
    if (!updated) throw new Error('Notice Not Found');
    return updated;
  }

  async deleteNotice(id: string, client_id: string) {
    await this.repo.hardDelete(id, client_id);
    return { message: 'Notice Deleted Successfully' };
  }
}