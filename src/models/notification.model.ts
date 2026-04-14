import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db/connection';
import { NotificationAttributes } from '../interface/notification.interface';

interface NotificationCreationAttributes
  extends Optional<NotificationAttributes, 'id' | 'client_id' | 'data' | 'is_read' | 'created_at' | 'updated_at'> {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes {

  public id!: string;
  public client_id!: string;
  public receiver_id!: string;
  public title!: string;
  public body!: string;
  public type!: string;
  public data!: any;
  public is_read!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    receiver_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'general'
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);
