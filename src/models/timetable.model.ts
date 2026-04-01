import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Timetable extends Model {
  declare id: string;
  declare client_id: string;
  declare teacher_id: string;
  declare standard: string;
  declare division: string;
  declare day: string;
  declare subject: string;
  declare start_time: string;
  declare end_time: string;
  declare date: string | null;
  declare created_by: string;
  declare updated_by: string | null;
}

Timetable.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "clients", key: "id" },
    },
    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "teachers", key: "id" },
      onDelete: "CASCADE",
    },
    standard: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    division: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    day: {
      type: DataTypes.ENUM("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    end_time: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    tableName: "timetables",
    timestamps: true,
    underscored: true,
  }
);

export default Timetable;
