import { Notice } from '../models/notice.model';
import { NoticeAttributes } from '../interface/notice.interface';
import { Op } from 'sequelize';
import { User } from '../models/users.model';

export class NoticeRepository {

  async create(data: NoticeAttributes) {
    const notice = await Notice.create(data);
    return await Notice.findByPk(notice.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });
  }

  async findAll(client_id: string, role?: string, page = 1, limit = 10, class_name?: string, date?: string) {
    const offset = (page - 1) * limit;

    const whereClause: any = { is_active: true, client_id };
    
    // Role filter - show specific role OR 'all'
    if (role) {
      whereClause[Op.or] = [
        { role },
        { role: 'all' }
      ];
    }
    
    // Date filter
    if (date) whereClause.notice_date = date;
    
    // If class_name provided, show notices for that class OR 'all' classes
    if (class_name) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { class_name },
            { class_name: null },
            { class_name: 'all' }
          ]
        }
      ];
    }

    const { rows, count } = await Notice.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    return { data: rows, total: count };
  }

  async findById(id: string, client_id: string) {
    return await Notice.findOne({
      where: { id, client_id, is_active: true }
    });
  }

  async update(id: string, data: Partial<NoticeAttributes>, client_id: string) {
    await Notice.update(data, { where: { id, client_id } });
    return this.findById(id, client_id);
  }

  async softDelete(id: string) {
    return await Notice.update(
      { is_active: false },
      { where: { id } }
    );
  }

  async hardDelete(id: string, client_id: string) {
    return await Notice.destroy({ where: { id, client_id } });
  }
}