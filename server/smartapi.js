const axios = require('axios');
const { authenticator } = require('otplib');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

let jwtToken = null;
let tokenExpiry = 0;

async function login() {
  const totpCode = authenticator.generate(process.env.SMARTAPI_TOTP_SECRET);

  const response = await axios.post(
    'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword',
    {
      clientcode: process.env.SMARTAPI_CLIENT_ID,
      password: process.env.SMARTAPI_PIN,
      totp: totpCode
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': '127.0.0.1',
        'X-ClientPublicIP': '127.0.0.1',
        'X-MACAddress': '00:00:00:00:00:00',
        'X-PrivateKey': process.env.SMARTAPI_KEY
      }
    }
  );

  if (response.data && response.data.data && response.data.data.jwtToken) {
    jwtToken = response.data.data.jwtToken;
    tokenExpiry = Date.now() + 1000 * 60 * 60 * 7; // ~7 hours validity
    console.log('SmartAPI login successful');
    return jwtToken;
  } else {
    console.error('SmartAPI login failed:', response.data);
    throw new Error('SmartAPI login failed');
  }
}

async function getToken() {
  if (!jwtToken || Date.now() > tokenExpiry) {
    await login();
  }
  return jwtToken;
}

module.exports = { getToken, login };
