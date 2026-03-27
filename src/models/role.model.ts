import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/connection";
import { IRole, IRoleCreation } from "../interface/role.interface";

export class Role
  extends Model<IRole, IRoleCreation>
  implements IRole
{
  public id!: string;
  public name!: string;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "roles",
    timestamps: false,
  }
);
