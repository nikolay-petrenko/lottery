const DataTypes = require("sequelize");
const orm = require("./../builder");

module.exports = orm.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    telegram: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["email", "login"]
      }
    ],
    timestamps: false
  }
);
