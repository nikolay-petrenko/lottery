const router = require("express").Router();

const appendToGoogleSheet = require('../controllers/googleSheet');

router.post("/:sheetName", async (req, res, next) => {
  const sheetName = req.params.sheetName;

  await appendToGoogleSheet(sheetName, [
    req.body.name,
    req.body.phone,
    req.body.telegram,
    req.body.role
  ]);

  res.status(204).send({
    message: 'Ok'
  });
});

module.exports = router;
