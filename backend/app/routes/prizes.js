const router = require('express').Router();

const { User } = require('../database/');
const { Prize } = require('../database/');

router.get('/', async (req, res, next) => {
  const prizes = await Prize.findAll();

  res.send(prizes);
});

router.post('/:prizeId', async (req, res, next) => {
  const prizeId = req.params.prizeId;

  await User.update({
    prizeId: prizeId
  }, {
    where: {
      id: req.body.userId
    }
  });
  await Prize.decrement('amount', {
    where: {
      id: prizeId
    }
  })
});

module.exports = router;
