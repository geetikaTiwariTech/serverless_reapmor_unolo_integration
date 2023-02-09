const fetch = require('node-fetch');
module.exports.doGetRequest = async (inputUrl, headerValue) => {
  // let data;
  let fetchHeaders = { method: 'GET', headers: headerValue }
  const res = await fetch(inputUrl, fetchHeaders);
  let data;
  if (res.ok) {
    data = await res.json();
  } else {
    data = `Response Status is ${res}`;
  }
  return data;
}
