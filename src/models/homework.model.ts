import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";
import { Teacher } from "./teacher.model";   // 👈 IMPORT IMPORTANT

export class Homework extends Model {
  public id!: string;
}

Homework.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    class_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    homework_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    homework_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    attachment_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "homework",
    timestamps: true,
    createdAt: "created_on",
    updatedAt: "updated_on",
  }
);
