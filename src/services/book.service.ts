import {
  createBookRepo,
  findAllBooksRepo,
  updateBookRepo,
  deleteBookRepo,
} from "../repositories/book.repository";

export const addBookService = async (bookData: any, userId: string) => {
  return await createBookRepo({
    ...bookData,
    created_by: userId,
  });
};

export const getBooksService = async (filters: any) => {
  const { count, rows } = await findAllBooksRepo(filters);

  return {
    pagination: {
      total: count,
      page: Number(filters.page || 1),
      limit: Number(filters.limit || 10),
      totalPages: Math.ceil(count / Number(filters.limit || 10)),
    },
    books: rows,
  };
};

export const updateBookService = async (
  bookId: string,
  updateData: any,
  userId: string
) => {
  const book = await updateBookRepo(bookId, {
    ...updateData,
    updated_by: userId,
  });

  if (!book) {
    throw new Error("Book not found");
  }

  return book;
};

export const deleteBookService = async (bookId: string) => {
  const book = await deleteBookRepo(bookId);

  if (!book) {
    throw new Error("Book not found");
  }

  return { message: "Book deleted successfully" };
};
