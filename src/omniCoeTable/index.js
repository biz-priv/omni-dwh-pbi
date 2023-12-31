const get = require('lodash.get');
const {
    executeQuery
} = require("../commonFunctions/dynamo");
const {
    publishErrorMessageToSNS
} = require('../commonFunctions/helpers');
const {
    v4: uuidv4
} = require("uuid");

exports.handler = async (event, context) => {
    console.log("test message")
    console.info("Received event:", JSON.stringify(event));
    const records = get(event, 'Records', []);
    console.log(records);
    await Promise.all(records.map(async (record) => {
        try {
            const body = JSON.parse(get(record, 'body', '{}'));
            console.log("body", body);
            const newImage = get(body, 'NewImage', {});
            let dateThreshold = process.env.DATE_THRESHOLD;
            dateThreshold = new Date(dateThreshold);
            console.log("threshold date", dateThreshold);
            console.log(JSON.stringify(newImage));
            const dateTimeEntered = get(newImage, 'DateTimeEntered.S', '');
            if (!dateTimeEntered) {
                return null;
            }
            const curRecordDateTimeEntered = new Date(dateTimeEntered);
            console.log("curRecordDateTimeEntered", curRecordDateTimeEntered)
            if (curRecordDateTimeEntered > dateThreshold) {
                const orderNo = get(newImage, 'FK_OrderNo.S', '');
                const headerparams = {
                    TableName: process.env.SHIPMENT_HEADER_TABLE_NAME,
                    KeyConditionExpression: `PK_OrderNo = :orderNo`,
                    ExpressionAttributeValues: {
                        ":orderNo": {
                            S: orderNo
                        }
                    },
                };
                const headerResult = await executeQuery(headerparams);
                const items = get(headerResult, 'Items', []);
                console.log("items", items);
                let housebill = get(items, '[0].Housebill.S', '');
                if (housebill !== '0') {
                    let userid = get(newImage, 'FK_UserId.S', '');
                    let file_nbr = orderNo;
                    let date_entered = curRecordDateTimeEntered;
                    if (userid !== null &&
                        file_nbr !== null &&
                        date_entered !== null && housebill !== null) {
                        const payload = {
                            id: uuidv4(),
                            User_id: userid,
                            file_nbr: file_nbr,
                            date_entered: date_entered,
                            housebill: housebill,
                            status: "Pending"
                        };
                        console.log(payload);
                        // insert into db
                    }
                } else {
                    console.info("housebill value is zero");
                }
            }
        } catch (error) {
            const functionName = context.functionName;
            console.log("error",error);
            //await publishErrorMessageToSNS(functionName, error);
        }
    }));
};