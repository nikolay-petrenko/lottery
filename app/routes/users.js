const express = require('express');

const app = express();

const User = require('../database/models/User');
const Prize = require('../database/models/Prize');

app.post('/', async (req, res, next) => {

  const transaction = await User.sequelize.transaction();

  const [user, isCreated] = await User.findOrCreate({
    where: {
      email: req.body.email
    },
    defaults: { ...req.body },
    include: [{ model: Prize, as: 'prize' }],
    transaction
  });

  isCreated && transaction.commit();

  res.cookie('userId', user.id).send({
    prize: user.prize && user.prize.title
  })
});

module.exports = app;
