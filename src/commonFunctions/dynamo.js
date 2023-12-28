const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const {errorResponse}=require('./helpers')

async function putItem(params) {
  try {
    return await DynamoDB.put(params).promise();
  } catch (e) {
    console.error("Put Item Error:", e, "\nPut params:", params);
    throw errorResponse(500, "Error while putting item.");
  }
}

async function getItem(params) {
  try {
    return await DynamoDB.get(params).promise();
  } catch (e) {
    console.error("Get Item Error:", e, "\nGet params:", params);
    throw errorResponse(500, "Error while getting item.");
  }
}

async function executeQuery(params) {
  try {
    return await DynamoDB.query(params).promise();
  } catch (e) {
    console.error("Query Item Error:", e, "\nQuery params:", params);
    throw errorResponse(500, "Error while executing query.");
  }
}

module.exports = {
  putItem,
  getItem,
  executeQuery
};
