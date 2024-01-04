const get = require('lodash.get');
const {
    executeQuery,
    putItem
} = require("../commonFunctions/dynamo");
const {
    publishErrorMessageToSNS
} = require('../commonFunctions/helpers');
const {
    v4: uuidv4
} = require("uuid");

exports.handler = async (event, context) => {
    console.info("Received event:", JSON.stringify(event));
    const records = get(event, 'Records', []);
    console.info(records);
    await Promise.all(records.map(async (record) => {
        try {
            const body = JSON.parse(get(record, 'body', '{}'));
            console.info("body", body);
            const newImage = get(body, 'NewImage', {});
            let dateThreshold = process.env.DATE_THRESHOLD;
            dateThreshold = new Date(dateThreshold);
            console.info("threshold date", dateThreshold);
            console.info(JSON.stringify(newImage));
            const dateTimeEntered = get(newImage, 'DateTimeEntered.S', '');
            if (!dateTimeEntered) {
                return null;
            }
            const curRecordDateTimeEntered = new Date(dateTimeEntered);
            console.info("curRecordDateTimeEntered", curRecordDateTimeEntered)
            console.info("dateThreshold",dateThreshold)
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
                console.info("items", items);
                let housebill = get(items, '[0].Housebill.S', '');
                if (housebill !== '0') {
                    let userid = get(newImage, 'FK_UserId.S', '');
                    let file_nbr = orderNo;
                    let date_entered = curRecordDateTimeEntered;
                    console.info(typeof date_entered);
                    if (userid !== '' &&
                        file_nbr !== '' &&
                        date_entered !== '' &&
                        housebill !== '') {
                        // insert into db
                        const omniCoeTableParams = {
                            TableName: process.env.COE_TABLE_STAGING_TABLE_NAME,
                            Item: {
                                id: uuidv4(),
                                User_id: userid,
                                file_nbr: file_nbr,
                                date_entered: JSON.stringify(curRecordDateTimeEntered),
                                housebill: housebill,
                                status: "Pending"
                            }
                        };
                        await putItem(omniCoeTableParams);
                        console.info("record is inserted successfully");
                    }
                } else {
                    console.info("housebill value is zero");
                }
            }
        } catch (error) {
            const functionName = context.functionName;
            console.info("error", error);
            await publishErrorMessageToSNS(functionName, error);
        }
    }));
};