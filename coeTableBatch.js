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
    console.log("recordsToProcess",recordsToProcess);
    if (recordsToProcess.length > 0) {
        console.log("inside the if block")
        await insertData(recordsToProcess);
        //await updateStatusInDynamoDB(recordsToProcess);
    }
    } catch (error) {
        const functionName = 'omni-coe-batch-' + process.env.ENV_STAGE_NAME;
      await publishErrorMessageToSNS(functionName,error);
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
        console.log("dynamodb result",result)
        return result;
    }
    catch(error){
        console.error("An error occurred while attempting to fetch data from the Omni COE staging table(Function name:fetchData, fileName:coeTableBatch.js). Error details:", error);
        throw error;
    }
}

async function insertData(data) {
    const redshiftTableName = process.env.COE_REDSHIFT_TABLE;
    const dynamodbTableName = process.env.COE_TABLE_STAGING_TABLE_NAME;
    try {
        await connectToRedshift();

        // Prepare data for bulk insert
        const values = data.map(item => [
            item.User_id.S,
            item.housebill.S,
            JSON.parse(item.date_entered.S),
            item.file_nbr.S,
            'CURRENT_TIMESTAMP',
            'CURRENT_TIMESTAMP'
        ]);

        // Construct the insert statement with numbered placeholders
        const insertQuery = `
            INSERT INTO ${redshiftTableName} (
                userid, 
                housebill, 
                date_entered, 
                file_nbr, 
                load_create_date, 
                load_update_date
            )
            VALUES 
                ${values.map(() => '(?,?,?,?,?,?)').join(',\n')};
        `;

        // Flatten the values array for passing to the executeQueryOnRedshift function
        const flattenedValues = values.flat();

        // Execute the insert statement with numbered placeholders
        const redshiftStartTime = Date.now();
        await executeQueryOnRedshift(insertQuery, flattenedValues);
        const redshiftEndTime = Date.now();
        const redshiftExecutionTime = redshiftEndTime - redshiftStartTime;
        console.info(`Redshift execution time: ${redshiftExecutionTime} ms`);
        console.info('Records inserted into Redshift.');

        // Update the status flag column in the dynamodb table for each item
        for (const item of data) {
            const updateParams = {
                TableName: dynamodbTableName,
                Key: {
                    id: get(item, 'id.S', ''),
                },
                UpdateExpression: 'SET #status = :newStatus',
                ExpressionAttributeNames: {
                    '#status': 'status',
                },
                ExpressionAttributeValues: {
                    ':newStatus': 'Completed'
                },
            };
            const startTime = Date.now();
            await updateItem(updateParams);
            const endTime = Date.now();
            const executionTime = endTime - startTime;
            console.info(`Updation of dynamodb record execution time: ${executionTime} ms`);
            console.info(`Record with id ${item.id.S} updated in DynamoDB`);
        }
    } catch (error) {
        console.error('Error inserting data:', error);
        throw error;
    } finally {
        await disconnectFromRedshift();
    }
}
  await handlerAsyncFunction();
})();