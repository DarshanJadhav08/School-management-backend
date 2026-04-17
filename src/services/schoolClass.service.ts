import SchoolClassRepo from "../repositories/schoolClass.repo";
import SchoolClass from "../interface/schoolClass.interface";

export class SchoolClassService {
  private repo: SchoolClassRepo;

  constructor() {
    this.repo = new SchoolClassRepo();
  }

  async addClass(data: SchoolClass) {
    return this.repo.addClass(data);
  }

  async addMultipleClasses(classes: SchoolClass[]) {
    return this.repo.addMultipleClasses(classes);
  }

  async deleteClass(id: string) {
    return this.repo.deleteClass(id);
  }

  async updateClass(id: string, data: Partial<SchoolClass>) {
    return this.repo.updateClass(id, data);
  }

  async getActiveClasses(client_id: string) {
    return this.repo.getActiveClasses(client_id);
  }
}