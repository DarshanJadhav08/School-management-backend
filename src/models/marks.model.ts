import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Marks extends Model {
  declare id: string;
  declare student_id: string;
  declare client_id: string | null;
  declare teacher_id: string;
  declare first_name: string;
  declare roll_number: string;
  declare subject_name: string;
  declare marks_obtained: number;
  declare total_marks: number;
  declare exam_name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Marks.init(
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
      allowNull: true,
      references: {
        model: "clients",
        key: "id",
      },
    },

    teacher_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "teachers",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    roll_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    subject_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    marks_obtained: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    total_marks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },

    exam_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'General',
    },
  },
  {
    sequelize,
    tableName: "marks",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["student_id", "subject_name", "exam_name", "client_id"],
      },
    ],
  }
);

export default Marks;
