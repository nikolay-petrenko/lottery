const ApiKeys = require("./models/ApiKeys");
const Users = require("./models/Users");

// RELATIONS
Users.hasOne(ApiKeys);
ApiKeys.belongsTo(Users);

module.exports = { Users, ApiKeys };
