import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Teacher extends Model {
  declare id: string;
  declare user_id: string;
  declare client_id: string | null;

  declare first_name: string | null;
  declare middle_name: string | null;
  declare last_name: string | null;

  declare date_of_birth: Date | null;
  declare gender: "male" | "female" | "other" | null;

  declare profile_image_url: string | null;
  declare mobile_number: string | null;

  declare designation: string | null;
  declare qualification: string | null;

  declare joining_date: Date | null;
  declare experience_years: number | null;

  declare is_class_teacher: boolean;
  declare assigned_standard: string | null;
  declare assigned_division: string | null;

  declare unique_id: string | null;

  declare created_by: string | null;
  declare updated_by: string | null;

  declare created_on: Date | null;
  declare updated_on: Date | null;
}

Teacher.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
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
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
    },
    profile_image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joining_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_class_teacher: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    assigned_standard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assigned_division: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    unique_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_on: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_on: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "teachers",
    timestamps: false,
  }
);
