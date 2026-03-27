import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db/connection";

interface SchoolClassAttributes {
  id: string;
  class_name: string;
  client_id: string;
  is_active?: boolean;
  created_by?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

interface SchoolClassCreationAttributes
  extends Optional<
    SchoolClassAttributes,
    "id" | "is_active" | "created_by" | "created_at" | "updated_at"
  > {}

export class SchoolClass
  extends Model<SchoolClassAttributes, SchoolClassCreationAttributes>
  implements SchoolClassAttributes
{
  public id!: string;
  public class_name!: string;
  public client_id!: string;
  public is_active!: boolean;
  public created_by!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SchoolClass.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },

    class_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "school_classes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
export default SchoolClass