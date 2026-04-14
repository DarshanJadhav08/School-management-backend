export interface NotificationAttributes {
  id: number;
  client_id?: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at?: Date;
  updated_at?: Date;
}
