const get = require('lodash.get');
const {publishErrorMessageToSNS}=require("./src/commonFunctions/helpers");
const {executeQuery, updateItem}=require('./src/commonFunctions/dynamo');
const {connectToRedshift,executeQueryOnRedshift, disconnectFromRedshift}=require('./src/commonFunctions/redshift');
const AWS = require('aws-sdk');
const sns = new AWS.SNS();
/*
1. Fetch data from the dynamodb table where status is pending
2. Insert records into Redshift table
3. Update status to 'Completed' in DynamoDB
*/
(async () => {
async function handlerAsyncFunction() {
  try {
    // Batch logic
    const recordsToProcess = await fetchData();
    if (recordsToProcess.length > 0) {
        await insertData(recordsToProcess);
        await updateStatusInDynamoDB(recordsToProcess);
    }
    } catch (error) {
        const functionName = 'omni-coe-batch-' + process.env.ENV_STAGE_NAME;
      //await publishErrorMessageToSNS(functionName,error);
      process.exit(1);
    }
}
async function fetchData(){
    // Fetch data from dynamodb table where the status is Pending
    const tableName=process.env.COE_TABLE_STAGING_TABLE_NAME;
    const indexName=process.env.COE_TABLE_STAGING_TABLE_STATUS_INDEX;
    const params = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':status': { S: 'Pending' }
        }
    };
    try{
        const result = await executeQuery(params);
        return get(result, 'Items', []);
    }
    catch(error){
        console.log(error);
        throw error;
    }
}

async function updateStatusInDynamoDB(recordsToUpdate) {
    const tableName = process.env.COE_TABLE_STAGING_TABLE_NAME;
    try {
        await Promise.all(recordsToUpdate.map(async (record) => {
            const updateParams = {
                TableName: tableName,
                Key: {
                    id: get(record, 'id.S', ''), 
                },
                UpdateExpression: 'SET #status = :newStatus',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':newStatus': 'Completed'
                },
            };
            await updateItem(updateParams);
            console.log(`Record with id ${record.id.S} updated in DynamoDB`);
        }));
        console.log('All records updated in DynamoDB');
    } catch (error) {
        console.error('Error updating records in DynamoDB:', error);
        throw error;
    }
}

async function insertData(data) {
    const tableName=process.env.COE_REDSHIFT_TABLE
    try {
      await connectToRedshift();
  
      const results = await Promise.all(data.map(async (item) => {
        const query = `
          INSERT INTO ${tableName} (userid, housebill, date_entered, file_nbr, load_create_date, load_update_date)
          SELECT
              $1 AS userid,
              $2 AS housebill,
              TO_DATE($3, 'YYYY-MM-DD') AS date_entered,
              $4 AS file_nbr,
              CURRENT_TIMESTAMP AS load_create_date,
              CURRENT_TIMESTAMP AS load_update_date
          WHERE NOT EXISTS (
              SELECT 1
              FROM ${tableName}
              WHERE
                  userid = $5 AND
                  housebill = $6 AND
                  date_entered = TO_DATE($7, 'YYYY-MM-DD') AND
                  file_nbr = $8
          );
        `;
  
        const values = [
          item.User_id.S,
          item.housebill.S,
          JSON.parse(item.date_entered.S), 
          item.file_nbr.S,
          item.User_id.S,
          item.housebill.S,
          JSON.parse(item.date_entered.S), 
          item.file_nbr.S,
        ];
        
        return executeQueryOnRedshift(query, values);
      }));
      console.log('All data inserted successfully:');
    } catch (error) {
      console.error('Error inserting data:', error);
      throw error
    } finally {
      await disconnectFromRedshift();
    }
  }
  await handlerAsyncFunction();
})();