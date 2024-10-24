import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db/sqlite";

export class User extends Model {
  public id!: number;
  public username!: string;
  public email!: string;
  public hash!: string;
  public salt!: string;
  public twoFactor!: boolean;
  public secret?: string;
  public session?: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    salt: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    twoFactor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    secret: {
      type: DataTypes.STRING,
    },
    session: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: "users",
  }
);
