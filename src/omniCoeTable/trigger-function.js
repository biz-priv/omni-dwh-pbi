const AWS = require("aws-sdk");
const batch = new AWS.Batch();

exports.handler = async (event) => {
    try {
        const params = {
            jobDefinition: process.env.JOB_DEFINITION,
            jobName: process.env.JOB_NAME,
            jobQueue: process.env.JOB_QUEUE,
        };
        const data = await batch.submitJob(params).promise();
        console.log("Job submitted successfully:", data);
        return {
            "message": "Job submitted successfully:"
        };
    } catch (error) {
        console.error("Error submitting job:", error);
        throw error;
    }
};