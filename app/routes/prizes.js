const express = require('express');

const app = express();

const User = require('../database/models/User');
const Prize = require('../database/models/Prize');

app.get('/', async (req, res, next) => {
  const prizes = await Prize.findAll();

  res.send(prizes);
});

app.post('/:prizeId', async (req, res, next) => {
  console.log(req.cookies);
  const prizeId = req.params.prizeId;

});

module.exports = app;
