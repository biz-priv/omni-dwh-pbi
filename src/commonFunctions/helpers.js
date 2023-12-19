const axios = require('axios');
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

function errorResponse(message) {
  console.error("Error handler message: ", message);
  return JSON.stringify({
      message: message
  });
}

async function publishErrorMessageToSNS(error) {
  const stage_val=process.env.ENV_STAGE_NAME
  const params = {
    Message: `An error occurred in omni-coe-table-${stage_val}. Error details: ${error}.`,
    TopicArn: process.env.ERROR_SNS_ARN,
  };

  try {
    await sns.publish(params).promise();
    console.log('Error message published to SNS successfully.');
  } catch (err) {
    console.error('Error publishing message to SNS:', err);
  }
}

module.exports = { errorResponse, publishErrorMessageToSNS };
