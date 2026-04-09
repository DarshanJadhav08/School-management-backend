import { Student } from "../models/student.model";
import { User } from "../models/users.model";
import { Role } from "../models/role.model";
import { Op } from "sequelize";

export const createStudentRepo = async (studentData: any) => {
  const { roll_no,
    class: className,
    section, client_id,
    first_name,
    last_name,
    ...rest } = studentData;
  return await Student.create({
    ...rest,
    client_id,
    first_name,
    last_name,
    standard: className,
    division: section,
  });
};

export const findAllStudentsRepo = async (filters: any) => {
  const { search, class: className, section, is_active, client_id, limit = 10, offset = 0 } = filters;

  const whereUser: any = { is_active: true };
  const whereStudent: any = {};

  if (client_id) {
    whereUser.client_id = client_id;
  }

  if (search) {
    whereUser.first_name = { [Op.like]: `%${search}%` }; // same logic
  }

  if (className) {
    whereStudent.standard = className;
  }

  if (section) {
    whereStudent.division = section;
  }

  if (is_active !== undefined) {
    whereUser.is_active = is_active === 'true';
  }

  const result = await Student.findAndCountAll({
    where: whereStudent,
    include: [
      {
        model: User,
        as: "user",
        where: whereUser,
        attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"],
      },
    ],
    attributes: [
      "id",
      "user_id",
      "client_id",
      "first_name",
      "middle_name",
      "last_name",
      "parent_name",
      "mobile_number",
      "date_of_birth",
      "roll_number",
      "gender",
      "profile_image_url",
      "aadhar_number",
      "standard",
      "division",
      "admission_date",
      "address",
      "category",
      "unique_id",
      "created_by",
      "created_on",
      "updated_by",
      "updated_on"
    ],
    limit: Number(limit),   // ✅ added
    offset: Number(offset), // ✅ added
    order: [["standard", "ASC"], ["division", "ASC"]],
  });

  return result;
};

export const findStudentByIdRepo = async (studentId: string) => {
  return await Student.findByPk(studentId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "middle_name", "last_name", "phone", "is_active"],
      },
    ],
    attributes: [
      "id",
      "user_id",
      "client_id",
      "first_name",
      "middle_name",
      "last_name",
      "parent_name",
      "mobile_number",
      "date_of_birth",
      "roll_number",
      "gender",
      "profile_image_url",
      "aadhar_number",
      "standard",
      "division",
      "admission_date",
      "address",
      "category",
      "unique_id",
      "created_by",
      "created_on",
      "updated_by",
      "updated_on"
    ],
  });
};

export const updateStudentRepo = async (studentId: string, updateData: any) => {
  const student = await Student.findByPk(studentId);
  if (!student) return null;

  await student.update(updateData);
  return student;
};

export const deleteStudentRepo = async (studentId: string) => {
  const student = await Student.findByPk(studentId);
  if (!student) return null;

  const user = await User.findByPk(student.get("user_id") as string);
  if (user) {
    await user.destroy();
  }
  await student.destroy();

  return student;
};

export const findStudentRoleRepo = async () => {
  return await Role.findOne({ where: { name: "student" } });
};
