const authLib = require("./authLib.js");
const constantObj = require("./constants");
const httpObj = require("./httpAPIUtil");
const { v4: uuidv4 } = require('uuid');
const dbObj = require("./dbAction");
const dbGeoObj = require("./dynamodbGeo.js");
const commonUtil = require("./commonUtil");

const AWS = require("aws-sdk");

async function getLocationMap(){
    let S3 = new AWS.S3();
    const params = {
        Bucket: 'unolo-util-bucket',
        Key: 'location_mapping.json'
    }
    return new Promise((resolve,reject)=>{
        try{
            S3.getObject(params,(err,data)=> {
                if(err){
                    reject(err);
                }else{
                    console.log("unparsed data",data);
                    resolve(JSON.parse(data.Body));
                }
            })
        }catch(e){
            reject(e);
        }
    })
}

async function getCropData() {
    // let data;
    let resp;
    try {
        let authUnoloResp = await authLib.getAuthUnoloToken();
        //const unoloClientUrl = `${process.env.UNOLO_DOMAIN}/${constantObj.CLIENT_END_POINT}`;
        const unoloClientUrl = `https://api-lb-ext.unolo.com/${constantObj.CLIENT_END_POINT}`;
        resp = await httpObj.doGetRequest(unoloClientUrl, authUnoloResp);
    }
    catch (err) {
        resp = { 'data': 'Error in getting Crop Data from Unolo' };
    }
    return resp;
}

const _migrateCropData = async () => {
    try {
        let cropData = await getCropData();
        let jsonCropArray = cropData['data'];
        //const slicedArray = jsonCropArray.slice(0, 2);
        for (let i = 0; i < 500; i++) {
            let crop = jsonCropArray[i];
            console.log(crop);
            await _insertCropDataAllTables(crop);
         
        }
        return "SUCCESS";
    }
    catch (err) {
        console.log("Error in InsertCropData(): ", err);
    }
}

const _insertCropDataAllTables = async (crop) => {
    let newGeoHashId = await insertGeoData(crop);
    let respActive = await insertCropActive(crop);
    let respDet = await insertCropDetails(crop, newGeoHashId);
    return newGeoHashId;
}

async function insertGeoData(cropData) {
    let geoData = prepGeoInput(cropData);
    await dbGeoObj.geoInsertPoint(geoData);
    return geoData.newGeoHashId;
}

function prepGeoInput(geoDetail) {
    const newGeoHashId = uuidv4();
    const item = {
        "Item": {
            "Reapmor_data": {
                "M": {
                    "CropId": { "S": geoDetail.clientID },
                    "RangeKey": { "S": newGeoHashId },
                    "Commodity": { "S": geoDetail.crop },
                    "Latitude": { "S": geoDetail.lat.toString() },
                    "Longitude": { "S": geoDetail.lng.toString() },
                    "FarmerName": { "S": geoDetail.clientName },
                    "CropArea": { "S": geoDetail.radius.toString() },
                    "CropSowingDate": { "S": new Date(geoDetail.createdTs).toString() }
                }
            }
        }
    };
    const outGeoInput = {
        "newGeoHashId": newGeoHashId,
        "item": item,
        "Lat": geoDetail.lat,
        "Long": geoDetail.lng
    };

    return outGeoInput;

}

async function insertCropActive(crop) {
    let inputPK = prepCropActivePK(crop);
    let data = prepCropActiveData(crop);
    return await dbObj.insertData(constantObj.CROP_TABLE_NAME, inputPK, crop.clientID, data);
}

async function _insertCropEndPoint(data){
    let inputPK = uuidv4();
    return await dbObj.insertDataNoSK(constantObj.CROP_ENDPOINT_TABLE_NAME, inputPK, data);
}

async function _insertPhotosEndPoint(data){
    let inputPK = uuidv4();
    return await dbObj.insertDataNoSK(constantObj.PHOTOS_ENDPOINT_TABLE_NAME, inputPK, data);
}

async function _insertQuestionnareEndPoint(data){
    let inputPK = uuidv4();
    return await dbObj.insertDataNoSK(constantObj.QUESTIONNARE_ENDPOINT_TABLE_NAME, inputPK, data);
}

function prepCropActivePK(cropDet) {
    const clientLoc = commonUtil.getLocationDetails(cropDet);
    return `ACTIVECROPLIST#COMMODITY#${cropDet.crop}#CROPSTATUS#${constantObj.ACTIVE_STATUS}#COUNTRY#${clientLoc.Country}#STATE#${clientLoc.State}#DISTRICT#${clientLoc.District}#SUBDISTRICT#${clientLoc.SubDistrict}`;
}

function prepCropActiveData(cropDet) {
    const clientLoc = commonUtil.getLocationDetails(cropDet);
    return {
        'CropId': cropDet.clientID,
        'Commodity': cropDet.crop,
        'CropStatus': constantObj.ACTIVE_STATUS,
        'Country': clientLoc.Country,
        'State': clientLoc.State,
        'District': clientLoc.District,
        'SubDistrict': clientLoc.SubDistrict,
        'FarmerName': cropDet.clientName,
        'Latitude': cropDet.lat,
        'Longitude': cropDet.lng,
        'CropArea': cropDet.radius,
        'CropSowingDate': new Date(cropDet.createdTs).toString()
    };
}

async function insertCropDetails(crop, geoHashRange) {
    let inputPK = prepCropDetPK(crop);
    let data = prepCropDetData(crop, geoHashRange);
    return await dbObj.insertData(constantObj.CROP_TABLE_NAME, inputPK, crop.clientID, data);
}

function prepCropDetPK(cropDet) {
    return `CROPDETAILS#CROPID#${cropDet.clientID}`;
}

function prepCropDetData(cropDet, geoHashRangeId) {
    const clientLoc = commonUtil.getLocationDetails(cropDet);
    return {
        'CropId': cropDet.clientID,
        'FarmerDetails': {
            'FarmerName': cropDet.clientName,
            'FarmerPhoneNumber': cropDet.phoneNumber,
            'FarmerPhotoS3URL': 'TBD'
        },
        'CropDetails': {
            'CropBaseData': {
                'Commodity': cropDet.crop,
                'CropSowingDate': new Date(cropDet.createdTs).toString(),
                'CropArea': cropDet.radius,
                'CropStatus': constantObj.ACTIVE_STATUS,
                'CropAdditionDate': new Date(cropDet.createdTs).toString(),
                'CropTerminationDate': ''
            },
            'CropLocation': {
                'Country': clientLoc.Country,
                'State': clientLoc.State,
                'District': clientLoc.District,
                'SubDistrict': clientLoc.SubDistrict,
                'Village': clientLoc.Location,
                'Lat': cropDet.lat,
                'Lon': cropDet.lng,
                'GeoHashRangeKey': geoHashRangeId
            },
            'CropPhotosS3URL': [],
            'CropQuestionnaire': []
        }
    };
}

module.exports = {
    insertCropDataAllTables: _insertCropDataAllTables,
    migrateCropData: _migrateCropData,
    insertCropEndPoint: _insertCropEndPoint,
    insertPhotosEndPoint: _insertPhotosEndPoint,
    insertQuestionnareEndPoint: _insertQuestionnareEndPoint
}



