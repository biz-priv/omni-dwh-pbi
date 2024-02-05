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
            const dateTimeEntered = get(newImage, 'DateTimeEntered.S', '');
            if (!dateTimeEntered) {
                return null;
            }
            const curRecordDateTimeEntered = new Date(dateTimeEntered);
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
                const items = await executeQuery(headerparams);
                // const items = get(headerResult, 'Items', []);
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
                            const compositeKey = `${file_nbr}-${userid}-${JSON.stringify(curRecordDateTimeEntered)}-${housebill}`;
                            const checkParams = {
                                TableName: process.env.COE_TABLE_STAGING_TABLE_NAME,
                                IndexName: 'compositeKey-index',
                                KeyConditionExpression: '#compositeKey = :compositeKey',
                                ExpressionAttributeNames: {
                                    '#compositeKey': 'compositeKey'
                                },
                                ExpressionAttributeValues: {
                                    ':compositeKey': { S: compositeKey }
                                }
                            };
                            const existingRecord = await executeQuery(checkParams);
                            console.log("existingRecord",existingRecord);
                        if (!existingRecord) {
                            console.log("inside the !existingRecord.Item")
                            // Insert into the staging table if the combination is unique

                            const omniCoeTableParams = {
                                TableName: process.env.COE_TABLE_STAGING_TABLE_NAME,
                                Item: {
                                    id: uuidv4(),
                                    User_id: userid,
                                    file_nbr: file_nbr,
                                    date_entered: JSON.stringify(curRecordDateTimeEntered),
                                    housebill: housebill,
                                    status: "Pending",
                                    compositeKey: compositeKey
                                }
                            };
                            console.log("payload that is added",omniCoeTableParams);
                            await putItem(omniCoeTableParams);
                            console.info("Record is inserted successfully");
                        } else {
                            console.info("Record with the same combination already exists. Skipping insertion.");
                        }
                    }
                } else {
                    console.info("housebill value is zero");
                }
            }
        } catch (error) {
            const functionName = context.functionName;
            console.info("Error generated in the omniCoeTable, Error details:", error);
            await publishErrorMessageToSNS(functionName, error);
        }
    }));
};