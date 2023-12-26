const { executeQuery } = require("../commonFunctions/dynamo");
exports.handler = async (event) => {
    //Fetch data from notes table in real time
    const records = event.Records;
    for (const record of records) {
        // Iterate through each record 
        try{
            // Filter records with DateTimeEntered more than 2023-01-01
            const body = JSON.parse(record.body);
            const newImage = body.NewImage;
            const dateThreshold=process.env.DATE_THRESHOLD
            dateThreshold=new Date(dateThreshold)
            const dateTimeEntered= newImage.DateTimeEntered
            if (dateTimeEntered === '' || dateTimeEntered === null || dateTimeEntered === undefined) {
                continue
            }
            const curRecordDateTimeEntered=new Date(dateTimeEntered)
            if (curRecordDateTimeEntered>dateThreshold){
                const orderNo = newImage.FK_OrderNo.S;
                const referenceParams = {
                    TableName: 'SHIPMENT_HEADER_TABLE_NAME',
                    KeyConditionExpression: 'pk_orderno = :orderNo',
                    ExpressionAttributeValues: {
                        ':orderNo': orderNo,
                    },
                };
                const headerResult = await executeQuery(referenceParams);
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
                    console.info("headerResult has no values");
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