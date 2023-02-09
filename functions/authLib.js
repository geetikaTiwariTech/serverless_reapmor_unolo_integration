const httpUtil = require("./httpAPIUtil.js");
const constantObj = require("./constants.js");

const getToken = (params) => {
    let tokenString;
    try {
        tokenString = params.headers.authorization;
    }
    catch (err) {
        throw new Error('Expected "event.authorization Bearer Token" parameter to be set');
    }

    if (!tokenString) {
        throw new Error(`Invalid Authorization token`);
    } else {
        const match = tokenString.match(/^Bearer (.*)$/);
        if (!match || match.length < 2) {
            throw new Error(`Invalid Authorization token - ${tokenString} does not match "Bearer .*"`);
        }
    }

    const jwtToken = tokenString.split(' ')[1]

    if (!(jwtToken === process.env.JWT_TOKEN)) {
        throw new Error(`Invalid Authorization token - ${tokenString} does not match Valid Token`);
    }

    return true;
}

module.exports.authenticate = (params) => {
    console.log(params);
    const validToken = getToken(params);
    return validToken;
}

module.exports.getAuthUnoloToken = async () => {
    let resp;
    try {
        //const unoloLoginUrl = `${process.env.UNOLO_DOMAIN}/${constantObj.LOGIN_END_POINT}`;
        const unoloLoginUrl = `https://api-lb-ext.unolo.com/${constantObj.LOGIN_END_POINT}`;
        //resp = await httpUtil.doGetRequest(unoloLoginUrl,{'id': process.env.UNOLO_LOGIN_ID,'password':process.env.UNOLO_LOGIN_PWD})
        resp = await httpUtil.doGetRequest(unoloLoginUrl, { 'id': '10293', 'password': 'Y573DupnKc72' })
        console.log(resp);
    }
    catch (err) {
        console.log(err);
    }
    return resp;
}