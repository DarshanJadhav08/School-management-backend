export interface MarksAttributes {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  subject_name: string;
  marks_obtained: number;
  created_at?: Date;
  updated_at?: Date;
}

export type MarksCreationAttributes = Omit<
  MarksAttributes,
  "id" | "created_at" | "updated_at"
>;
