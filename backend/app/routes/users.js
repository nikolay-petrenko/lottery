const router = require('express').Router();

const { User } = require('../database/');
const { Prize } = require('../database/');

const appendToGoogleSheet = require('../controllers/googleSheet');

router.post('/', async (req, res, next) => {
  const transaction = await User.sequelize.transaction();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  const [user, isCreated] = await User.findOrCreate({
    where: {
      ip
    },
    defaults: { ...req.body, ip },
    include: [{ model: Prize, as: 'prize' }],
    transaction
  });

  transaction.commit();

  // if(!isCreated){
  //   return res.status(403).send({
  //     message: 'User already created'
  //   });
  // }

  await appendToGoogleSheet('lotteryRostovNaDony', [
    req.body.name,
    req.body.phone,
    req.body.telegram,
    req.body.role
  ]);

  res.cookie('userId', user.id).send({
    // prize: user.prize && user.prize.title,
    userId: user.id
  })
});

module.exports = router;
