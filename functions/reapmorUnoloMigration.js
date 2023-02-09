'use strict';
const migrateUnoloToAWS = require("./fetchExtAPI.js");
const authObj = require("./authLib.js");
const dbActionObj = require("./dbAction.js");

const headers = {
  "Content-Type": "application/json",
};

module.exports.handler = async (event) => {
  try {
    let validToken = false;
    let statusCode = 200;
    let body;
    try {
      // const cropDet = {
      //   "clientLocation": "Kadirpura",
      //   "crop": "Mint Leaves"
      // };
      // await dbActionObj.terminateCropItem("000eba23-538b-4db1-a092-6a9702d6c2d2",cropDet);
      //body = "Data deleted successfully";
      //await migrateUnoloToAWS.migrateCropData();
      // validToken = await authObj.authenticate(event);
      // if (validToken) {
      return routePath(event);
      // }
    }
    catch (err) {
      console.log("Error in handler:::", err);
      statusCode = 401;
      body = err.message;
    }

    return {
      statusCode,
      body,
      headers,
    };
  } catch (err) {
    console.log(err);
  }
  return { statusCode: 200, body: JSON.stringify("geetika") }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

async function routePath(event) {
  let statusCode = 200;
  let body;
  let requestJSON;
  try {
    switch (event.routeKey) {
      case "POST /items/create":
        requestJSON = JSON.parse(event.body);
        await migrateUnoloToAWS.insertCropDataAllTables(requestJSON);
        body = `Inserted item ${requestJSON.clientID}`;
        break;
      case "PUT /terminate/item/{id}":
        requestJSON = JSON.parse(event.body);
        console.log("requestJSON input");
        console.log(event.pathParameters);
        console.log(event.pathParameters.id);
        const clientId = event.pathParameters.id;
        if (clientId != '') {
          await dbActionObj.terminateCropItem(clientId, requestJSON);
          body = `Updated item ${event.pathParameters.id}`;
        } else {
          statusCode = 404;
          body = `Please provide cropId!`;
        }

        break;
      case "POST /batchmigrate":
        //requestJSON = JSON.parse(event.body);
        await migrateUnoloToAWS.migrateCropData();
        body = `Inserted items`;
        break;
      case "POST /crop/create":
        requestJSON = JSON.parse(event.body);
        await migrateUnoloToAWS.insertCropEndPoint(requestJSON);
        body = `Inserted item`;
        break;
      case "POST /photos/create":
        requestJSON = JSON.parse(event.body);
        await migrateUnoloToAWS.insertPhotosEndPoint(requestJSON);
        body = `Inserted item `;
        break;
      case "POST /questionnare/create":
        requestJSON = JSON.parse(event.body);
        await migrateUnoloToAWS.insertQuestionnareEndPoint(requestJSON);
        body = `Inserted item`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers,
  };
}

//serverless invoke local --stage dev -f reapmorUnoloMigration
