export interface ITeacher {
  id: string;
  name: string;
  user_id: string;
  subject?: string;
  qualification?: string;
}

export interface ITeacherCreation extends Omit<ITeacher, "id"> {}
