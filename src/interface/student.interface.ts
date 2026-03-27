export interface IStudent {
  id: string;
  user_id: string;
  roll_no?: string;
  class?: string;
  section?: string;
  parent_name?: string;
  parent_phone?: string;
}

export interface IStudentCreation extends Omit<IStudent, "id"> {}
