const express = require("express");
const bodyParser = require("body-parser");

const config = require("./config");

const app = express();

const users = require('./app/routes/users');
const prizes = require('./app/routes/prizes');
//middleware
app.use(bodyParser.json());

app.use('/users', users);
app.use('/prizes', prizes);

//Server starting
app.listen(config.applicationPort, () => {
  console.log("Application started at port: ", config.applicationPort);
});
