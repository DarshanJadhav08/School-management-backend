export default interface SchoolClass {
  id?: string;
  class_name: string;
  client_id: string;
  is_active?: boolean;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}