import {
  createHomeworkRepo,
  findHomeworkByClassAndDateRepo,
  findAllHomeworkRepo,
  updateHomeworkRepo,
  deleteHomeworkRepo,
} from "../repositories/homework.repository";
import { Teacher } from "../models/teacher.model";

// ➕ Add Homework
export const addHomeworkService = async (
  homeworkData: any,
  teacherId: string,
  userIdForCreatedBy: string
) => {
  const { class_name, subject_name, homework_text, homework_date, attachment_url, client_id } = homeworkData;

  const teacher = await Teacher.findByPk(teacherId);
  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const existing = await findHomeworkByClassAndDateRepo(
    class_name,
    homework_date,
    subject_name
  );

  if (existing) {
    throw new Error("Homework already exists for this class, subject and date");
  }

  return await createHomeworkRepo({
    teacher_id: teacherId,
    class_name,
    subject_name,
    client_id,
    homework_text,
    homework_date,
    attachment_url,
    created_by: userIdForCreatedBy,
  });
};

// 📥 Single GET (Role Based)
export const getHomeworkService = async (filters: any) => {
  const { count, rows } = await findAllHomeworkRepo(filters);

  return {
    pagination: {
      total: count,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 10),
      totalPages: Math.ceil(count / Number(filters.limit || 10)),
    },
    homework: rows,
  };
};

// ✏ Update
export const updateHomeworkService = async (
  homeworkId: string,
  updateData: any,
  userId: string
) => {
  const homework = await updateHomeworkRepo(homeworkId, {
    ...updateData,
    updated_by: userId,
  });

  if (!homework) {
    throw new Error("Homework not found");
  }

  return homework;
};

// ❌ Delete
export const deleteHomeworkService = async (homeworkId: string) => {
  const homework = await deleteHomeworkRepo(homeworkId);

  if (!homework) {
    throw new Error("Homework not found");
  }

  return { message: "Homework deleted successfully" };
};