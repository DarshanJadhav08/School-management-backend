export interface IUser {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
  password: string;
  role_id: string;
  role_name: string;
  client_id?: string | null;
  unique_id?: string;
  is_active?: boolean;
  created_at?: Date;
}

export interface IUserCreation
  extends Omit<IUser, "id" | "created_at"> {}
