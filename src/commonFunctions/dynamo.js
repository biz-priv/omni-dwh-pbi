const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const DocumentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

const maxRetries = 5;
const retryDelay = 5000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function putItem(params) {
  let retries = 0;
  let error;
  while (retries < maxRetries) {
    try {
      return await DocumentClient.put(params).promise();
    } catch (e) {
      console.error("Put Item Error:", e, "\nPut params:", params);
      error = e;
      retries++;
      await delay(retryDelay * retries);
    }
  }
  throw error;
}

async function getItem(params) {
  let retries = 0;
  let error;
  while (retries < maxRetries) {
    try {
      return await DynamoDB.getItem(params).promise();
    } catch (e) {
      console.error("Get Item Error:", e, "\nGet params:", params);
      error = e;
      retries++;
      await delay(retryDelay * retries);
    }
  }
  throw error;
}

async function executeQuery(params) {
  let retries = 0;
  let error;
  while (retries < maxRetries) {
    try {
      return await DynamoDB.query(params).promise();
    } catch (e) {
      console.error("Query Item Error:", e, "\nQuery params:", params);
      error = e;
      retries++;
      await delay(retryDelay * retries);
    }
  }
  throw error;
}

module.exports = {
  putItem,
  getItem,
  executeQuery,
};
