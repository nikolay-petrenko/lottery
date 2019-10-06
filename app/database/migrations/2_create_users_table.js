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
    }).
      then(() => {
        QueryInterface.addConstraint('users', ['email', 'telegram', 'phone'], {
          type: 'unique',
          name: 'user_unique_key'
        });
      });
  },
  down: (QueryInterface, DataTypes) => {
    return QueryInterface.dropTable("users");
  }
};
