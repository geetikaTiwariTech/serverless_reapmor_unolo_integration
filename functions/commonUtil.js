const locMapData = require("./../file/location_mapping.json");
const constantObj = require("./constants");
module.exports.getLocationDetails = (cropDet) => {
    let clientLocationDet = {};
    const clientLoc = cropDet.clientLocation;
    const clientKey = clientLoc.charAt(0).toUpperCase() + clientLoc.slice(1).toLowerCase();
    if (clientKey in locMapData) {
        clientLocationDet = {
            'Location': clientKey,
            'Country': locMapData[clientKey].Country,
            'State': locMapData[clientKey].State,
            'District': locMapData[clientKey].District,
            'SubDistrict': locMapData[clientKey].SubDistrict
        }

    } else {
        clientLocationDet = {
            'Location': clientKey,
            'Country': constantObj.NOT_EXISTS,
            'State': constantObj.NOT_EXISTS,
            'District': constantObj.NOT_EXISTS,
            'SubDistrict': constantObj.NOT_EXISTS
        }
    }
    return clientLocationDet;
}
