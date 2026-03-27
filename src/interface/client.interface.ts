export interface IClient {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  info?: string;
  created_at?: Date;
}

export interface IClientCreation extends Omit<IClient, "id" | "created_at"> {}
