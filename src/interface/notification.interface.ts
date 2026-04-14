export interface NotificationAttributes {
  id: string;
  client_id?: string;
  receiver_id: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  is_read: boolean;
  created_at?: Date;
  updated_at?: Date;
}
