'use strict';
const objDynamoGeo = require("./dynamodbGeo");
const migrateUnoloToAWS = require("./fetchExtAPI.js");

module.exports.handler = async (event) => {
  try {
    // return {
    //   statusCode: 200,
    //   body: JSON.stringify(
    //     {
    //       message: 'Go Serverless v1.0! Your function executed successfully!',
    //       input: event,
    //     },
    //     null,
    //     2
    //   ),
    // };

    // await db
    //   .put({
    //     TableName,
    //     Item: newAnimal,
    //   })
    //   .promise()
    //objDynamoGeo.geoCreateTable();
    //objDynamoGeo.geoInsertPoint({});
    //objDynamoGeo.geoQueryPoint(2);
    //objDynamoGeo.geoDeletePoint();
    migrateUnoloToAWS.migrateCropData();
  } catch (err) {
    console.log(err);
  }
  return { statusCode: 200, body: JSON.stringify("geetika") }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

//serverless invoke local --stage dev -f reapmorUnoloMigration
