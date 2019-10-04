module.exports = {
  up: (QueryInterface, DataTypes) => {
    return QueryInterface.createTable("users", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING
      },
      telegram: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      role: {
        type: DataTypes.STRING,
        allowNull: true
      }
    });
  },
  down: (QueryInterface, DataTypes) => {
    return QueryInterface.dropTable("users");
  }
};
