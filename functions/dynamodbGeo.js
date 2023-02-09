const AWS = require("aws-sdk")
const ddbGeo = require('dynamodb-geo');
const constantObj = require("./constants");
const node2TS = require('nodes2ts');

AWS.config.update({ region: 'ap-south-1' });
const db = new AWS.DynamoDB();
//const tableName = process.env.TABLE_NAME
const tableName = constantObj.CROP_LOCATION_TABLE_NAME;
const config = new ddbGeo.GeoDataManagerConfiguration(db, tableName);
const myGeoTableManager = new ddbGeo.GeoDataManager(config);
config.longitudeFirst = true;
config.hashKeyLength = 7;
config.consistentRead = true;
node2TS.S2RegionCoverer.FACE_CELLS = [0, 1, 2, 3, 4, 5].map(face => node2TS.S2Cell.fromFacePosLevel(face, 0, 0));
module.exports.geoCreateTable = async () => {
    try {
        // Use GeoTableUtil to help construct a CreateTableInput.
        const createTableInput = ddbGeo.GeoTableUtil.getCreateTableRequest(config);

        // Tweak the schema as desired
        createTableInput.ProvisionedThroughput.ReadCapacityUnits = 2;

        console.log('Creating table with schema:');
        // console.dir(createTableInput, { depth: null });

        // Create the table
        const result = await db.createTable(createTableInput).promise()
            // Wait for it to become ready
            .then(function () { return db.waitFor('tableExists', { TableName: config.tableName }).promise() })
            .then(function () { console.log(`${config.tableName} Table created and ready!`) });
    } catch (error) {
        console.error(error);
    }
}

module.exports.geoInsertPoint = async (inputData) => {
    console.log("Inside geoInsertPoint:::", inputData);
    try {
        return await myGeoTableManager.putPoint({
            RangeKeyValue: { S: inputData.newGeoHashId }, // Use this to ensure uniqueness of the hash/range pairs.
            GeoPoint: { // An object specifying latitutde and longitude as plain numbers. Used to build the geohash, the hashkey and geojson data
                latitude: inputData.Lat,
                longitude: inputData.Long
            },
            PutItemInput: inputData.item
        }).promise()
        .then((data) => { console.log('Data Inserted Done!'); return "SUCCESS" });
    } catch (error) {
        console.error(error);
    }
    //return inputData.newGeoHashId;
}

module.exports.geoQueryPoint = async (inputData) => {
    try {
        await myGeoTableManager.queryRectangle({
            MinPoint: {
                latitude: 20.225730,
                longitude: 0.019593
            },
            MaxPoint: {
                latitude: 39.889499,
                longitude: 0.848383
            }
        })
            // Print the results, an array of DynamoDB.AttributeMaps
            .then(console.log);
        //console.log(result);
    } catch (error) {
        console.log(error);
    }
}

module.exports.geoDeletePoint = async (inputData) => {
    try {
        myGeoTableManager.deletePoint({
            RangeKeyValue: { S: 'f2a75024-7c76-4777-aa50-1f2916acd8ac' },
            GeoPoint: { // An object specifying latitutde and longitude as plain numbers.
                latitude: 29.31,
                longitude: 0.03
            },
            DeleteItemInput: { // Optional, any additional parameters to pass through.
                // TableName and Key are filled in for you
                // Example: Only delete if the point does not have a country name set
                //ConditionExpression: 'attribute_not_exists(country)'
            }
        }).promise()
            .then(function () { console.log('Point Deletion Done!') });
    } catch (error) {
        console.log(error);
    }
}