const { executeQuery } = require("../commonFunctions/dynamo");
exports.handler = async (event) => {
    console.info("Received event:", JSON.stringify(event));
    //Fetch data from notes table in real time
    const records = event.Records;   
    console.log(records);
    for (const record of records) {
        // Iterate through each record 
        try{
            // Filter records with DateTimeEntered more than 2023-01-01
            const body = JSON.parse(record.body);
            console.log("body",body)
            const newImage = body.NewImage;
            let dateThreshold=process.env.DATE_THRESHOLD
            dateThreshold=new Date(dateThreshold)
            console.log(JSON.stringify(newImage))
            const dateTimeEntered= newImage.DateTimeEntered.S
            if (dateTimeEntered === '' || dateTimeEntered === null || dateTimeEntered === undefined) {
                continue
            }
            const curRecordDateTimeEntered=new Date(dateTimeEntered)
            if (curRecordDateTimeEntered>dateThreshold){
                const orderNo = newImage.FK_OrderNo.S;
                const headerparams = {
                    TableName: process.env.SHIPMENT_HEADER_TABLE_NAME,
                    KeyConditionExpression: `PK_OrderNo = :orderNo`,
                    ExpressionAttributeValues: { ":orderNo": { S: orderNo } },
                  };
                  const headerResult = await executeQuery(headerparams);
                const items = headerResult.Items;
                let housebill;
                if (items && items.length > 0) {
                    housebill = items[0].Housebill.S;
                    if (housebill !== '0') {
                        //create the payload 
                        const payload={
                            User_id: newImage.FK_UserId.S,
                            file_nbr: newImage.pk_orderno.S,
                            date_entered: curRecordDateTimeEntered,
                            housebill: housebill
                        }    
                        console.log(payload)   
                        //insert into db          
                    } else {
                        console.info("housebill value is zero");
                        continue;
                    }
                  } else {
                    console.info("header table has no records for this orderno");
                    continue;
                  }
            }
        }
        catch (error) {
            console.error(error);
            return error;
          }
    }
}