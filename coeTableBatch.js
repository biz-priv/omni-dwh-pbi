const { promisify } = require('util');
const get = require('lodash.get');
const map=require('lodash.map');
const moment = require("moment");
const { getDbConnection, executeQuery, endDbConnection } = require("./src/commonFunctions/db")
const {errorResponse}=require("./src/commonFunctions/index")
const {publishErrorMessageToSNS} = require("./src/commonFunctions/helpers")
const AWS = require('aws-sdk');
const sns = new AWS.SNS();
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
    // Logic to fetch data from dynamodb table
    try{

    }
    catch(error){

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
