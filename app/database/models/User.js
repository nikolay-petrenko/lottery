const DataTypes = require("sequelize");
const orm = require("../builder");

const Prize = require('./Prize');

const User = orm.define(
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
    },
    createdAt: {
      field: 'created_at',
      type: DataTypes.DATE,
    },
    updatedAt: {
      field: 'updated_at',
      type: DataTypes.DATE,
    },
    prize_id: {
      type: DataTypes.INTEGER,
      references: { model: 'prizes', key: 'id' }
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["email"]
      }
    ]
  }
);

User.hasOne(Prize, { foreignKey: 'id' });
Prize.belongsTo(User, { as: 'user', foreignKey: 'id' });

module.exports = User;