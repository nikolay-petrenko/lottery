module.exports = {
    up: (QueryInterface, DataTypes) => {
      return QueryInterface.createTable("prizes", {
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
      });
    },
    down: (QueryInterface, DataTypes) => {
      return QueryInterface.dropTable("prizes");
    }
  };
  