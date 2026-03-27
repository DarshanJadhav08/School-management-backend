import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Client extends Model {}

Client.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
    },
    phone: DataTypes.STRING,

     info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "clients",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);
