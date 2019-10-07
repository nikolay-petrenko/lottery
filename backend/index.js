const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const config = require("./config");

const app = express();

const users = require('./app/routes/users');
const prizes = require('./app/routes/prizes');
const affhub = require('./app/routes/affhub');
//middleware
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', users);
app.use('/api/prizes', prizes);
app.use('/api/affhub', affhub);

//Server starting
app.listen(config.applicationPort, () => {
  console.log("Application started at port: ", config.applicationPort);
});
