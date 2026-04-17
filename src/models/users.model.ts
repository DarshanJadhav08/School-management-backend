import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";
import { IUser, IUserCreation } from "../interface/user.interface";

export class User
  extends Model<IUser, IUserCreation>
  implements IUser
{
  public id!: string;
  public first_name!: string;
  public middle_name!: string;
  public last_name!: string;
  public phone!: string;
  public password!: string;
  public role_id!: string;
  public role_name!: string;
  public client_id!: string;
  public unique_id!: string;
  public is_active!: boolean;
  public fcm_token!: string;
  public last_device_id!: string;
  public created_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    middle_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    unique_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    fcm_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_device_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);
