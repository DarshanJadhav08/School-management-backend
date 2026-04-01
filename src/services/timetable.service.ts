import { timetableRepository } from "../repositories/timetable.repository";

export const timetableService = {
  async create(data: any, user: any, client_id: string) {
    return timetableRepository.create({ ...data, client_id, created_by: user.user_id });
  },

  async getById(id: string) {
    const entry = await timetableRepository.findById(id);
    if (!entry) throw { statusCode: 404, message: "Timetable entry not found" };
    return entry;
  },

  async getByDay(client_id: string, day: string, standard?: string, division?: string) {
    return timetableRepository.findByDay(client_id, day, standard, division);
  },

  async getByDate(client_id: string, date: string, standard?: string, division?: string) {
    return timetableRepository.findByDate(client_id, date, standard, division);
  },

  async getAll(client_id: string, standard?: string, division?: string) {
    return timetableRepository.findAll(client_id, standard, division);
  },

  async update(id: string, data: any, user: any) {
    const entry = await timetableRepository.findById(id);
    if (!entry) throw { statusCode: 404, message: "Timetable entry not found" };
    await timetableRepository.update(id, { ...data, updated_by: user.user_id });
    return timetableRepository.findById(id);
  },

  async delete(id: string) {
    const count = await timetableRepository.delete(id);
    if (!count) throw { statusCode: 404, message: "Timetable entry not found" };
    return { message: "Deleted successfully" };
  },
};
