const axios = require('axios');
const AWS = require('aws-sdk');
const sns = new AWS.SNS();

function errorResponse(httpStatus, message) {
    console.error("Error handler message: ", message);
    return JSON.stringify({
      httpStatus: httpStatus,
      message: message
    });
  }

async function publishErrorMessageToSNS(functionName,error) {
  const params = {
    Message: `An error occurred in ${functionName}. Error details: ${error}.`,
    Subject: `Lambda function ${functionName} has failed.`,
    TopicArn: process.env.ERROR_SNS_ARN,
  };
  try {
    await sns.publish(params).promise();
    console.info('Error message published to SNS successfully.');
  } catch (err) {
    console.error('Error publishing message to SNS:', err);
  }
}

module.exports = { errorResponse, publishErrorMessageToSNS };
