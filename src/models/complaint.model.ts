import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Complaint extends Model {
  declare id: string;
  declare student_id: string;
  declare client_id: string;
  declare title: string;
  declare description: string;
  declare role: string;
  declare target_name: string | null;
  declare status: 'pending' | 'resolved';
  declare response: string | null;
  declare responded_by: string | null;
  declare responded_at: Date | null;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Complaint.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "students",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Name of the teacher/admin this complaint is for',
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved'),
      defaultValue: 'pending',
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responded_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    responded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "complaints",
    timestamps: true,
    underscored: true,
  }
);

export default Complaint;
