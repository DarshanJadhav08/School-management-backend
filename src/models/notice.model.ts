import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../db/connection'
import { NoticeAttributes } from '../interface/notice.interface'

interface NoticeCreationAttributes
  extends Optional<NoticeAttributes, 'id' | 'document_url' | 'updated_by' | 'is_active' | 'created_at' | 'updated_at'> {}

export class Notice
  extends Model<NoticeAttributes, NoticeCreationAttributes>
  implements NoticeAttributes {

  public id!: string
  public title!: string
  public description!: string
  public notice_date!: Date
  public document_url!: string
  public class_name!: string
  public client_id!: string
  public created_by!: string
  public updated_by!: string
  public role!: 'student' | 'teacher' | 'all'
  public is_active!: boolean

  public readonly created_at!: Date
  public readonly updated_at!: Date
}

Notice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    notice_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    document_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    class_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    client_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },

    updated_by: {
      type: DataTypes.UUID,
      allowNull: true
    },

    role: {
      type: DataTypes.ENUM('student', 'teacher', 'all'),
      allowNull: false
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    tableName: 'notices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
)