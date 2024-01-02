const { promisify } = require('util');
const get = require('lodash.get');
// const { getDbConnection, executeQuery, endDbConnection } = require("./src/commonFunctions/db")
// const {errorResponse}=require("./src/commonFunctions/index")
// const {publishErrorMessageToSNS} = require("./src/commonFunctions/helpers")
// const AWS = require('aws-sdk');
// const sns = new AWS.SNS();
/*
Fetch data from the dynamodb table
insert into a redshift table
*/
(async () => {
async function handlerAsyncFunction() {
  try {
    // Batch logic
    console.log("Inside the Main try of the batch file")
    } catch (error) {
      await publishErrorMessageToSNS(error);
      process.exit(1)
      // return errorResponse(JSON.stringify(error));
    }
}
async function fetchData(){
    // Fetch data from dynamodb table where the status is Pending
    // const tableName=process.env.COE_TABLE_STAGING_TABLE_NAME;
    const tableName='omni-coe-table-staging-table-dev';
    const indexName = 'status-index';
    const params = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':status': 'Pending'
        }
    };
    try{
        const result = await executeQuery(params);
        const items = result.Items;
        console.log('Fetched items:', items);
    }
    catch(error){
        throw errorResponse(500, "Error while executing query.");
    }
}

async function insertDataIntoDatabase(item) {
    /*
    Insert data into coe_test table 
    */
    // const query = ;
    // const params = ;
    const connection = await getDbConnection(); 
    try {
      await executeQuery(connection, query, params);
      console.log(`Data inserted into the database:`);
    } catch (error) {
      console.error("Error while inserting data into the database", error);
      throw error;
    } finally {
      await endDbConnection(connection); 
    }
  }
  await handlerAsyncFunction();
})();