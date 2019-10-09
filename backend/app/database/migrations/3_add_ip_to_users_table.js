module.exports = {
  up: (QueryInterface, DataTypes) => {
    return QueryInterface.addColumn(
      'users',
      'ip',
      {
        type: DataTypes.STRING
      }
    );
  },
  down: (QueryInterface, DataTypes) => {
    return QueryInterface.removeColumn(
      'users',
      'ip'
    );  
  }
};
