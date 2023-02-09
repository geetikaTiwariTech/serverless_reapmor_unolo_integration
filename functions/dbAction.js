const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const constantObj = require("./constants");
const commonUtil = require("./commonUtil");
//const client = new AWS.DynamoDB.DynamoDBClient({});

//const dynamo = DynamoDBDocumentClient.from(client);

module.exports.insertData = async (tableName, inputPK, inputSK, detData) => {
    return await dynamoDB
        .put({
            Item: {
                PK: inputPK,
                SK: inputSK,
                Reapmor_data: detData
            },
            TableName: tableName,
        })
        .promise()
        .then(data => {
            return "SUCCESS";
        })
        .catch(console.error);
}

module.exports.insertDataNoSK = async (tableName, inputPK, detData) => {
    return await dynamoDB
        .put({
            Item: {
                PK: inputPK,
                data_object: detData
            },
            TableName: tableName,
        })
        .promise()
        .then(data => {
            return "SUCCESS";
        })
        .catch(console.error);
}


async function updateItem(tableName, inputId, inputSK, inputJSON) {
    // Set the parameters.
    const params = {
        TableName: tableName,
        Key: {
            PK: inputId,
            SK: inputSK
        }
    };
    // UpdateExpression: "set Country = :p",
    //     ExpressionAttributeValues: {
    //         ":p": inputJSON.Country
    //     },
    params["UpdateExpression"] = inputJSON.UpdateExpression;
    params["ExpressionAttributeValues"] = inputJSON.ExpressionAttributeValues;
    console.log("param Udpate:", params);
    return await dynamoDB.update(params).promise()
        .then(data => {
            console.log("Data updated successfully");
            return "SUCCESS";
        })
        .catch(console.error);
};


async function deleteItem(tableName, inputId, inputSK) {
    // Set the parameters.
    const params = {
        TableName: tableName,
        Key: {
            PK: inputId,
            SK: inputSK
        }
    };
    console.log("Deletion", params);
    return await dynamoDB.delete(params).promise()
        .then(data => {
            console.log("Data deleted successfully");
            return "SUCCESS";
        })
        .catch(console.error);
};

async function deleteGeoItem(tableName, inputId, inputSK) {
    // Set the parameters.
    const params = {
        TableName: tableName,
        Key: {
            hashKey: Number(inputId),
            rangeKey: inputSK
        }
    };
    console.log("Deletion", params);
    return await dynamoDB.delete(params).promise()
        .then(data => {
            console.log("Data deleted successfully");
            return "SUCCESS";
        })
        .catch(console.error);
};

async function queryItem(tableName, inputJSON) {
    // Set the parameters.
    const params = {
        TableName: tableName,
        KeyConditionExpression: inputJSON.KeyConditionExpression,
        ExpressionAttributeNames: inputJSON.ExpressionAttributeNames,
        ExpressionAttributeValues: inputJSON.ExpressionAttributeValues
    };
    console.log("query params", params);
    return await dynamoDB.query(params).promise()
        .then(data => {
            console.log("Data fetched successfully");
            console.log(data);
            return data;
        })
        .catch(console.error);
};

async function scanItem(tableName, inputJSON) {
    // Set the parameters.
    const params = {
        TableName: tableName,
        FilterExpression: inputJSON.FilterExpression,
        ExpressionAttributeNames: inputJSON.ExpressionAttributeNames,
        ExpressionAttributeValues: inputJSON.ExpressionAttributeValues
    };
    console.log("query params", params);
    return await dynamoDB.scan(params).promise()
        .then(data => {
            console.log("Data fetched successfully");
            console.log(data);
            return data;
        })
        .catch(console.error);
};

module.exports.terminateCropItem = async (clientId, cropDet) => {
    try {
        await deleteActiveCropItem(clientId, cropDet);
        await deleteGeoLocationItem(clientId);
        await setCropInactive(clientId);
    } catch (err) {
        console.log("Error in terminate crop:", err);
    }
}

async function setCropInactive(clientId) {
    try {
        const updateJSON = {
            UpdateExpression: "set Reapmor_data.CropDetails.CropBaseData.CropStatus = :cropStatus",
            ExpressionAttributeValues: {
                ":cropStatus": constantObj.INACTIVE_STATUS
            }
        }
        const updateData = await updateItem(constantObj.CROP_TABLE_NAME, `CROPDETAILS#CROPID#${clientId}`, clientId, updateJSON);
        console.log("Update status::", updateData);
        return updateData;
    } catch (err) {
        console.log("Error in DeleteActive Crop:", err);
    }
}


async function deleteActiveCropItem(clientId, cropDet) {
    try {
        const locMap = commonUtil.getLocationDetails(cropDet);
        const pkActivePK = `ACTIVECROPLIST#COMMODITY#${cropDet.crop}#CROPSTATUS#${constantObj.ACTIVE_STATUS}#COUNTRY#${locMap.Country}#STATE#${locMap.State}#DISTRICT#${locMap.District}#SUBDISTRICT#${locMap.SubDistrict}`;
        return await deleteItem(constantObj.CROP_TABLE_NAME, pkActivePK, clientId);
    } catch (err) {
        console.log("Error in DeleteActive Crop:", err);
    }
}

async function deleteGeoLocationItem(clientId) {
    try {
        const queryParamsCropBase = {
            KeyConditionExpression: "#PK = :primary_key_value and #SK = :sec_key_value",
            ExpressionAttributeNames: {
                "#PK": "PK",
                "#SK": "SK"
            },
            ExpressionAttributeValues: {
                ":primary_key_value": `CROPDETAILS#CROPID#${clientId}`,
                ":sec_key_value": clientId
            }
        }

        const dataCropDet = await queryItem(constantObj.CROP_TABLE_NAME, queryParamsCropBase);
        console.log(dataCropDet.Count);
        if (dataCropDet.Count > 0) {
            const geoHashRangeKey = dataCropDet.Items[0].Reapmor_data.CropDetails.CropLocation.GeoHashRangeKey;
            const queryParamsGeo = {
                FilterExpression: "#rangeKey = :sec_key_value",
                ExpressionAttributeNames: {
                    "#rangeKey": "rangeKey"
                },
                ExpressionAttributeValues: {
                    ":sec_key_value": geoHashRangeKey
                }
            }
            const geoDet = await scanItem(constantObj.CROP_LOCATION_TABLE_NAME, queryParamsGeo);
            console.log(geoDet);
            if (geoDet.Count > 0) {
                const geoHashKey = geoDet.Items[0].hashKey;
                console.log(geoHashKey);
                await deleteGeoItem(constantObj.CROP_LOCATION_TABLE_NAME, geoHashKey, geoHashRangeKey);
            }
        }
        return dataCropDet;
    } catch (err) {
        console.log("Error in DeleteActive Crop:", err);
    }
}

