const router = require('express').Router();

const { User } = require('../database/');
const { Prize } = require('../database/');

router.post('/', async (req, res, next) => {
  const transaction = await User.sequelize.transaction();

  const [user, isCreated] = await User.findOrCreate({
    where: {
      telegram: req.body.telegram || null,
      phone: req.body.phone || null,
    },
    defaults: { ...req.body },
    include: [{ model: Prize, as: 'prize' }],
    transaction
  });

  isCreated && transaction.commit();
  res.cookie('userId', user.id).send({
    prize: user.prize && user.prize.title,
    userId: user.id
  })
});

module.exports = router;
