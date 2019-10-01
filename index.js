const express = require("express");
const bodyParser = require("body-parser");

const config = require("./config");

const app = express();

//middleware
app.use(bodyParser.json());

//Server starting
app.listen(config.applicationPort, () => {
  console.log("Application started at port: ", config.applicationPort);
});
