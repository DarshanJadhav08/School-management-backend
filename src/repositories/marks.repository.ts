import Marks from "../models/marks.model";
import { MarksCreationAttributes } from "../interface/marks.interface";

class MarksRepository {
  async create(data: MarksCreationAttributes) {
    return Marks.create(data);
  }

  async findByStudent(student_id: string) {
    return Marks.findAll({ where: { student_id } });
  }

  async findOne(student_id: string, subject_name: string) {
    return Marks.findOne({ where: { student_id, subject_name } });
  }

  async update(
    student_id: string,
    subject_name: string,
    marks_obtained: number
  ) {
    return Marks.update(
      { marks_obtained },
      { where: { student_id, subject_name } }
    );
  }

  async delete(student_id: string, subject_name: string) {
    return Marks.destroy({ where: { student_id, subject_name } });
  }
}

export default new MarksRepository();
