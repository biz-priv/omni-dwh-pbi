const AWS = require("aws-sdk");
const batch = new AWS.Batch();
const {executeQuery} = require("../commonFunctions/dynamo");

exports.handler = async (event) => {
await fetchData()
    // try {
    //     const params = {
    //         jobDefinition: process.env.JOB_DEFINITION,
    //         jobName: process.env.JOB_NAME,
    //         jobQueue: process.env.JOB_QUEUE,
    //     };
    //     const data = await batch.submitJob(params).promise();
    //     console.log("Job submitted successfully:", data);
    //     return {
    //         "message": "Job submitted successfully:"
    //     };
    // } catch (error) {
    //     console.error("Error submitting job:", error);
    //     throw error;
    // }
};
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
        console.log(error)
        // throw errorResponse(500, "Error while executing query.");
    }
}