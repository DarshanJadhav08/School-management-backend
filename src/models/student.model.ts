import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";

export class Student extends Model {
  declare id: string;
  declare user_id: string;
  declare client_id: string | null;

  declare first_name: string | null;
  declare middle_name: string | null;
  declare last_name: string | null;
  declare parent_name: string | null;

  declare mobile_number: string | null;
  declare date_of_birth: Date | null;
  declare roll_number: string | null;

  declare gender: "male" | "female" | "other" | null;
  declare profile_image_url: string | null;
  declare aadhar_number: string | null;

  declare standard: string | null;
  declare division: string | null;

  declare admission_date: Date | null;
  declare address: string | null;

  declare category: "General" | "OBC" | "SC" | "ST" | "NT" | null;

  declare unique_id: string | null;
  declare created_by: string | null;
  declare updated_by: string | null;

  declare created_on: Date | null;
  declare updated_on: Date | null;
}

Student.init(
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
    parent_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mobile_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    roll_number: {
      type: DataTypes.STRING,
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
    aadhar_number: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    standard: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    division: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    admission_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('General', 'OBC', 'SC', 'ST', 'NT'),
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
    tableName: "students",
    timestamps: false,
  }
);

export default Student;
