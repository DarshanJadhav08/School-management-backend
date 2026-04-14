import { Op } from "sequelize";
import { Timetable } from "../models/timetable.model";
import { Teacher } from "../models/teacher.model";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const timetableRepository = {
  async create(data: Partial<Timetable>) {
    return Timetable.create(data as any);
  },

  async findById(id: string) {
    return Timetable.findByPk(id, {
      include: [{ model: Teacher, as: "teacher", attributes: ["id", "first_name", "middle_name", "last_name"] }],
    });
  },

  async findByDay(client_id: string, day: string, standard?: string, division?: string) {
    const where: any = { client_id, day };
    if (standard) where.standard = standard;
    if (division) {
      where.division = { [Op.or]: [division, "", null] };
    }
    return Timetable.findAll({
      where,
      include: [{ model: Teacher, as: "teacher", attributes: ["id", "first_name", "middle_name", "last_name"] }],
      order: [["start_time", "ASC"]],
    });
  },

  async findByDate(client_id: string, date: string, standard?: string, division?: string) {
    const dayName = DAYS[new Date(date).getDay()];
    const where: any = {
      client_id,
      [Op.or]: [
        { date },
        { date: null, day: dayName },
      ],
    };
    if (standard) where.standard = standard;
    if (division) {
      where.division = { [Op.or]: [division, "", null] };
    }
    return Timetable.findAll({
      where,
      include: [{ model: Teacher, as: "teacher", attributes: ["id", "first_name", "middle_name", "last_name"] }],
      order: [["start_time", "ASC"]],
    });
  },

  async findAll(client_id: string, standard?: string, division?: string) {
    const where: any = { client_id };
    if (standard) where.standard = standard;
    if (division) {
      where.division = { [Op.or]: [division, "", null] };
    }
    return Timetable.findAll({
      where,
      include: [{ model: Teacher, as: "teacher", attributes: ["id", "first_name", "middle_name", "last_name"] }],
      order: [["day", "ASC"], ["start_time", "ASC"]],
    });
  },

  async update(id: string, data: Partial<Timetable>) {
    const [count] = await Timetable.update(data as any, { where: { id } });
    return count;
  },

  async delete(id: string) {
    return Timetable.destroy({ where: { id } });
  },
};
