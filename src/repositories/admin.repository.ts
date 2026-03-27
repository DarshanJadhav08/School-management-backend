import { Admin } from "../models/admin.model";
import { User } from "../models/users.model";
import { Role } from "../models/role.model";
import { Op } from "sequelize";

export const createAdminRepo = async (adminData: any) => {
  return await Admin.create(adminData);
};

export const findAllAdminsRepo = async (filters: any) => {
  const { page = 1, limit = 10, search, designation, is_active, client_id } = filters;
  const offset = (Number(page) - 1) * Number(limit);

  const whereUser: any = { is_active: true };
  const whereAdmin: any = {};

  if (client_id) {
    whereAdmin.client_id = client_id;
  }

  if (search) {
    whereUser.first_name = { [Op.like]: `%${search}%` };
  }

  if (designation) {
    whereAdmin.designation = { [Op.like]: `%${designation}%` };
  }

  if (is_active !== undefined) {
    whereUser.is_active = is_active === 'true';
  }

  return await Admin.findAndCountAll({
    where: whereAdmin,
    include: [
      {
        model: User,
        as: "user",
        where: whereUser,
        attributes: ["id", "first_name", "last_name", "phone", "is_active", "created_at"],
      },
    ],
    attributes: ["id", "user_id", "client_id", "first_name", "middle_name", "last_name", "designation", "mobile_number", "profile_image_url", "qualification", "date_of_birth", "experience", "gender", "unique_id", "created_by", "created_on", "updated_by", "updated_on"],
    limit: Number(limit),
    offset: offset,
    order: [[{ model: User, as: "user" }, "created_at", "DESC"]],
  });
};

export const findAdminByIdRepo = async (adminId: string) => {
  return await Admin.findByPk(adminId, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "first_name", "last_name", "phone", "is_active", "created_at"],
      },
    ],
    attributes: ["id", "user_id", "client_id", "first_name", "middle_name", "last_name", "designation", "mobile_number", "profile_image_url", "qualification", "date_of_birth", "experience", "gender", "unique_id", "created_by", "created_on", "updated_by", "updated_on"],
  });
};

export const updateAdminRepo = async (adminId: string, updateData: any) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) return null;

  await admin.update(updateData);
  return admin;
};

export const deleteAdminRepo = async (adminId: string) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) return null;

  const user = await User.findByPk(admin.get("user_id") as string);
  if (user) {
    await user.update({ is_active: false });
  }

  return admin;
};

export const findAdminRoleRepo = async () => {
  return await Role.findOne({ where: { name: "admin" } });
};
