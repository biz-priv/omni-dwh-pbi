const mysql = require('mysql2/promise');
const util = require('util'); // Import the util module.
const {errorResponse} = require('./index');
const maxRetries = 5;
const retryDelay = 5000;

const delay = util.promisify(setTimeout); 

async function getDbConnection(type = "reader") {
  let retries = 0;
  let error;
  while (retries < maxRetries) {
    try {
      const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false },
        password: process.env.DB_PASSWORD,
        connectTimeout: 5000,
      };
      return await mysql.createConnection(config);
    } catch (e) {
      console.error("Db connection error: ", e);
      error=e;
      retries++;
      await delay(retryDelay * retries);
    }
  }
  throw error;
}

async function executeQuery(connection, query, params) {
  let retries = 0;
  let error;
  while (retries < maxRetries) {
    try {
      const [rows] = await connection.execute(query, params);
      return rows;
    } catch (e) {
      console.error("Db query error", e);
      console.error("Query: ", query, " Params: ", params);
      error=e
      retries++;
      await delay(retryDelay * retries);
    }
  }
  throw error;
}

async function endDbConnection(connection) {
  let retries = 0;
  let error;
  while (retries < maxRetries) {
    try {
      connection.end();
      return;
    } catch (e) {
      console.error("Unable to end MySQL connection: ", e);
      retries++;
      error=e
      await delay(retryDelay * retries);
  }
  }
  throw error
}

module.exports = { getDbConnection, executeQuery, endDbConnection };
