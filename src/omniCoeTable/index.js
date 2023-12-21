const { executeQuery } = require("../commonFunctions/dynamo");
exports.handler = async (event) => {
    /*
    Fetch data from notes table where timeentered>=2023-01-01
    */
    const trackingparams = {
        TableName: process.env.TRACKING_NOTES_TABLE_NAME,
        FilterExpression: "DateTimeEntered >= :date",
        ExpressionAttributeValues: {
          ":date": "2023-01-01",
        }
    };
    const trackingResult = await executeQuery(trackingparams);
    console.log("trackingResult",trackingResult)
}