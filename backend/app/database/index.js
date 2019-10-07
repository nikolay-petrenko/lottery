const Prize = require("./models/Prize");
const User = require("./models/User");

// RELATIONS
Prize.hasOne(User);
User.belongsTo(Prize);

module.exports = { User, Prize };
