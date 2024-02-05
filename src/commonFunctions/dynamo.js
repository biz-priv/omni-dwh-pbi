const AWS = require("aws-sdk");
const DynamoDB = new AWS.DynamoDB({ apiVersion: "2012-08-10" });
const DynamoDBClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const {errorResponse}=require('./helpers')

async function putItem(params) {
  try {
    return await DynamoDBClient.put(params).promise();
  } catch (e) {
    console.error("Put Item Error:", e, "\nPut params:", params);
    throw e;
  }
}

async function getItem(params) {
  try {
    return await DynamoDB.get(params).promise();
  } catch (e) {
    console.error("Get Item Error:", e, "\nGet params:", params);
    throw e;
  }
}
async function updateItem(params){
  try{
      await DynamoDBClient.update(params).promise();
  } catch(e){
    console.error("Query Item Error:", e, "\nQuery params:", params);
    throw e;
  }
}

async function executeQuery(params) {
  try {
      let items = [];
      let lastEvaluatedKey = null;
      do {
          if (lastEvaluatedKey) {
              params.ExclusiveStartKey = lastEvaluatedKey;
          }
          const data = await DynamoDB.query(params).promise();
          items = items.concat(data.Items);
          lastEvaluatedKey = data.LastEvaluatedKey;
      } while (lastEvaluatedKey);
      return items;
  } catch (error) {
      console.error("Query Item Error:", error, "\nQuery params:", params);
      throw error
  }
}

module.exports = {
  putItem,
  getItem,
  updateItem,
  executeQuery
};
