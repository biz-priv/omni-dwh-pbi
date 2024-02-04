const AWS = require("aws-sdk");
const batch = new AWS.Batch();
/*
1. Check if a job with the same name is already running in the job queue
2. If no job with the same name is running, submit the new job
3. Else don't trigger the job
*/
exports.handler = async (event) => {
    try {
        const jobName = process.env.JOB_NAME;
        const jobQueue = process.env.JOB_QUEUE;

        const existingJobs = await listJobs(jobQueue, jobName);
        const isJobRunning = existingJobs.some(job => job.jobName === jobName && job.status === 'RUNNING');

        if (!isJobRunning) {
            const params = {
                jobDefinition: process.env.JOB_DEFINITION,
                jobName: jobName,
                jobQueue: jobQueue,
            };
            const data = await batch.submitJob(params).promise();
            console.info("Job submitted successfully:", data);
            return { message: "Job submitted successfully" };
        } else {
            console.log("A job with the same name is already running. Skipping job submission.");
            return { message: "A job with the same name is already running. Skipping job submission." };
        }
    } catch (error) {
        console.error("Error submitting job:", error);
        throw error;
    }
};

async function listJobs(jobQueue, jobName) {
    const params = {
        jobQueue: jobQueue,
        jobStatus: 'RUNNING'
    };
    const data = await batch.listJobs(params).promise();
    return data.jobSummaryList;
}
