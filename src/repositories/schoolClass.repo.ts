import SchoolClass from "../models/schoolClass.model";
import SchoolClassInterface from "../interface/schoolClass.interface";

export default class SchoolClassRepo {
  async addClass(data: SchoolClassInterface) {
    const existing = await SchoolClass.findOne({
      where: { class_name: data.class_name, client_id: data.client_id }
    });
    if (existing) return null;
    return await SchoolClass.create(data);
  }

  async addMultipleClasses(classes: SchoolClassInterface[]) {
    const results = [];
    for (const cls of classes) {
      const existing = await SchoolClass.findOne({
        where: { class_name: cls.class_name, client_id: cls.client_id }
      });
      if (!existing) {
        const created = await SchoolClass.create(cls);
        results.push(created);
      }
    }
    return results;
  }

  async deleteClass(id: string) {
    const schoolClass = await SchoolClass.findByPk(id);
    if (!schoolClass) return null;
    await schoolClass.destroy();
    return schoolClass;
  }

  async updateClass(id: string, data: Partial<SchoolClassInterface>) {
    const schoolClass = await SchoolClass.findByPk(id);
    if (!schoolClass) return null;
    return await schoolClass.update(data);
  }

  async getActiveClasses(client_id: string) {
    return await SchoolClass.findAll({
      where: { client_id, is_active: true },
      attributes: ["id", "class_name"]
    });
  }
}