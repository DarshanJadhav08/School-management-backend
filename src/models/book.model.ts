import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Book extends Model {}

Book.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    book_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    class_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    book_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "books",
    timestamps: true,
    createdAt: "created_on",
    updatedAt: "updated_on",
  }
);
