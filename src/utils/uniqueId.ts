import { User, Student, Teacher, Admin } from "../models";
import { Op } from "sequelize";

const ROLE_PREFIXES = {
  student: "ZP-STD-",
  teacher: "ZP-TCH-",
  admin: "ZP-ADM-",
  superadmin: "ZP-SADM-"
};

export const generateUniqueId = async (roleName: string): Promise<string> => {
  const prefix = ROLE_PREFIXES[roleName as keyof typeof ROLE_PREFIXES];
  
  if (!prefix) {
    throw new Error(`Invalid role: ${roleName}`);
  }

  let model;
  let whereCondition: any = {};
  
  switch (roleName) {
    case "student":
      model = Student;
      whereCondition = { unique_id: { [Op.like]: 'ZP-STD-%' } };
      break;
    case "teacher":
      model = Teacher;
      whereCondition = { unique_id: { [Op.like]: 'ZP-TCH-%' } };
      break;
    case "admin":
      model = Admin;
      whereCondition = { unique_id: { [Op.like]: 'ZP-ADM-%' } };
      break;
    case "superadmin":
      model = User;
      whereCondition = { unique_id: { [Op.like]: 'ZP-SADM-%' } };
      break;
    default:
      throw new Error(`Invalid role: ${roleName}`);
  }

  // Get all records with same prefix and find highest number
  const records = await model.findAll({ 
    where: whereCondition,
    attributes: ['unique_id'],
    raw: true
  });

  let maxNumber = 0;
  records.forEach((record: any) => {
    if (record.unique_id) {
      const numPart = record.unique_id.split('-').pop();
      const num = parseInt(numPart || '0');
      if (num > maxNumber) {
        maxNumber = num;
      }
    }
  });

  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
};
