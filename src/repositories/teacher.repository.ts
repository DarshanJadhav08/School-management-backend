import { Teacher } from "../models/teacher.model";
import { User } from "../models/users.model";
import { Role } from "../models/role.model";
import { Op } from "sequelize";

export const createTeacherRepo = async (teacherData: any) => {
  return await Teacher.create(teacherData);
};

export const findAllTeachersRepo = async (filters: any) => {
  const { page = 1, limit = 10, search, subject, is_active, client_id } = filters;
  const offset = (Number(page) - 1) * Number(limit);

  const whereUser: any = { is_active: true };
  const whereTeacher: any = {};

  if (client_id) {
    whereUser.client_id = client_id;
  }

  if (search) {
    whereUser.first_name = { [Op.like]: `%${search}%` };
  }

  if (subject) {
    whereTeacher.subject = { [Op.like]: `%${subject}%` };
  }

  if (is_active !== undefined) {
    whereUser.is_active = is_active === 'true';
  }

  return await Teacher.findAndCountAll({
    where: whereTeacher,
    include: [
      {
        model: User,
        as: "user",
        where: whereUser,
        attributes: ["id", "first_name", "last_name", "phone", "is_active", "created_at"],
      },
    ],
    attributes: ["id", "user_id", "client_id", "first_name", "middle_name", "last_name", "date_of_birth", "gender", "profile_image_url", "mobile_number", "designation", "qualification", "joining_date", "experience_years", "is_class_teacher", "assigned_standard", "assigned_division", "unique_id", "created_by", "created_on", "updated_by", "updated_on"],
    limit: Number(limit),
    offset: offset,
    order: [[{ model: User, as: "user" }, "created_at", "DESC"]],
  });
};

export const findTeacherByIdRepo = async (teacherId: string) => {
  return await Teacher.findByPk(teacherId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "phone", "is_active", "created_at"],
      },
    ],
    attributes: ["id", "user_id", "client_id", "first_name", "middle_name", "last_name", "date_of_birth", "gender", "profile_image_url", "mobile_number", "designation", "qualification", "joining_date", "experience_years", "is_class_teacher", "assigned_standard", "assigned_division", "unique_id", "created_by", "created_on", "updated_by", "updated_on"],
  });
};

export const updateTeacherRepo = async (teacherId: string, updateData: any) => {
  const teacher = await Teacher.findByPk(teacherId);
  if (!teacher) return null;

  await teacher.update(updateData);
  return teacher;
};

export const deleteTeacherRepo = async (teacherId: string) => {
  const teacher = await Teacher.findByPk(teacherId);
  if (!teacher) return null;

  const user = await User.findByPk(teacher.get("user_id") as string);
  if (user) {
    await user.destroy();
  }
  await teacher.destroy();

  return teacher;
};

export const findTeacherRoleRepo = async () => {
  return await Role.findOne({ where: { name: "teacher" } });
};
