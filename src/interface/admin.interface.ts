export interface IAdmin {
  id: string;
  user_id: string;
  client_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  designation?: string;
  mobile_number?: string;
  profile_image_url?: string;
  qualification?: string;
  date_of_birth?: string;
  experience?: number;
  gender?: 'male' | 'female' | 'other';
}

export interface IAdminCreation extends Omit<IAdmin, "id"> {}
