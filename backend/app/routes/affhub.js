const path = require("path");
const router = require("express").Router();
const { google } = require("googleapis");
const moment = require("moment");

const config = require("../../config/google");
const resolve = file => path.resolve(__dirname, file);

router.post("/:sheetName", async (req, res, next) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(
    "../../config/google_sheets_credential.json"
  );
  const sheetName = req.params.sheetName;
  const { SCOPES, API_KEY, spreadsheetId } = config;

  const client = await google.auth.getClient({
    scopes: SCOPES
  });

  const sheets = google.sheets({
    version: "v4",
    auth: API_KEY
  });

  return await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:B`,
    includeValuesInResponse: true,
    insertDataOption: "INSERT_ROWS",
    valueInputOption: "RAW",
    resource: {
      values: [
        [
          req.body.name,
          req.body.phone,
          req.body.telegram,
          req.body.role,
          moment().format("MMMM Do YYYY, h:mm:ss a")
        ]
      ]
    },
    auth: client
  });
});

module.exports = router;
