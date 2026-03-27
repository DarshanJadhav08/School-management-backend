import { Book } from "../models/book.model";

export const createBookRepo = async (data: any) => {
  return await Book.create(data);
};

export const findAllBooksRepo = async (filters: any) => {
  const { page = 1, limit = 10, className, subjectName, client_id } = filters;

  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};

  if (client_id) where.client_id = client_id;
  if (className) where.class_name = className;
  if (subjectName) where.subject_name = subjectName;

  return await Book.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [["created_on", "DESC"]],
  });
};

export const updateBookRepo = async (bookId: string, updateData: any) => {
  const book = await Book.findByPk(bookId);
  if (!book) return null;
  await book.update(updateData);
  return book;
};

export const deleteBookRepo = async (bookId: string) => {
  const book = await Book.findByPk(bookId);
  if (!book) return null;
  await book.destroy();
  return book;
};
