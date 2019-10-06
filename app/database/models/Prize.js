const DataTypes = require("sequelize");
const orm = require("../builder");

const User = require('./User');

const Prize = orm.define(
  "prizes",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING
    },
    amount: {
      type: DataTypes.INTEGER
    }
  },
  {
    timestamps: false
  }
);

module.exports = Prize;