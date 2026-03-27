import { Homework } from "../models/homework.model";
import { Teacher } from "../models/teacher.model";
import { Op } from "sequelize";

// ➕ CREATE
export const createHomeworkRepo = async (data: any) => {
  return await Homework.create(data);
};

// 🔎 CHECK DUPLICATE
export const findHomeworkByClassAndDateRepo = async (
  className: string,
  date: string,
  subjectName: string
) => {
  return await Homework.findOne({
    where: {
      class_name: className,
      subject_name: subjectName,
      homework_date: date,
    },
  });
};

// 📥 SINGLE GET (USED BY SERVICE)
export const findAllHomeworkRepo = async (filters: any) => {
  const {
    page = 1,
    limit = 10,
    date,
    className,
    subjectName,
    teacherId,
    client_id,
    fromDate,
    toDate,
  } = filters;

  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {};

  if (client_id) where.client_id = client_id;
  
  // Handle className filter - check both numeric and text formats
  if (className) {
    const numericFormat = className.replace(/st|nd|rd|th/g, ''); // Remove suffixes
    const textFormat = className.includes('st') || className.includes('nd') || className.includes('rd') || className.includes('th') 
      ? className 
      : className + (className === '1' ? 'st' : className === '2' ? 'nd' : className === '3' ? 'rd' : 'th');
    
    where.class_name = {
      [Op.or]: [className, numericFormat, textFormat]
    };
  }
  
  if (subjectName) where.subject_name = subjectName;
  if (teacherId) where.teacher_id = teacherId;

  // Single Date
  if (date) {
    where.homework_date = date;
  }

  // Date Range
  if (fromDate && toDate) {
    where.homework_date = {
      [Op.between]: [fromDate, toDate],
    };
  }

  console.log("Homework Filter Query:", where);

  return await Homework.findAndCountAll({
    where,
    include: [
      {
        model: Teacher,
        as: "teacher",
        attributes: ["id", "first_name", "last_name"],
      },
    ],
    limit: Number(limit),
    offset,
    order: [["homework_date", "DESC"]],
  });
};

// ✏ UPDATE
export const updateHomeworkRepo = async (
  homeworkId: string,
  updateData: any
) => {
  const homework = await Homework.findByPk(homeworkId);
  if (!homework) return null;

  await homework.update(updateData);
  return homework;
};

// ❌ DELETE
export const deleteHomeworkRepo = async (homeworkId: string) => {
  const homework = await Homework.findByPk(homeworkId);
  if (!homework) return null;

  await homework.destroy();
  return homework;
};
