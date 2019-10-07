const ROOT_PATH = process.cwd();
const Sequelize = require("sequelize");
const config = require(ROOT_PATH + "/config/database");
let node_env = process.env.NODE_ENV || "development";

module.exports = new Sequelize({
  database: config[node_env].database,
  username: config[node_env].username,
  password: config[node_env].password,
  dialect: config[node_env].dialect,
  host: config[node_env].host,
  port: config[node_env].port,
  logging: false
});
