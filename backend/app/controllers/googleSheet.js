const path = require("path");
const { google } = require("googleapis");
const moment = require("moment");

const config = require("../../config/google");
const resolve = file => path.resolve(__dirname, file);

const appendToGoogleSheet = async (sheetName, data) => {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(
    "../../config/google_sheets_credential.json"
  );
  const { SCOPES, API_KEY, spreadsheetId } = config;

  const client = await google.auth.getClient({
    scopes: SCOPES
  });

  const sheets = google.sheets({
    version: "v4",
    auth: API_KEY
  });
  
  data.push(moment().format("MMMM Do YYYY, h:mm:ss a"));

  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:B`,
    includeValuesInResponse: true,
    insertDataOption: "INSERT_ROWS",
    valueInputOption: "RAW",
    resource: {
      values: [
        data
      ]
    },
    auth: client
  });
};

module.exports = appendToGoogleSheet;