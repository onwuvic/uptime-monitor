/**
 *  Create all helpers function
 */

// Dependencies
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const config = require('./config');



// Container for the helpers module
const helpers = {};

// Create a SHA256 hash
helpers.hash = (password) => {
  if(typeof(password) == 'string' && password.length > 0) {
    const hash = crypto.createHmac('sha256', config.secrete).update(password).digest('hex');
    return hash;
  }
  return false;
};

// Parse a JSON String to an object in all case, throwing
helpers.parseJsonToObject = (jsonString) => {
  try {
    const obj = JSON.parse(jsonString);
    return obj;
  } catch (error) {
    return {};
  }
};

helpers.generateRandomString = (strLength) => {
  // check the value type
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false
  if(strLength) {
    // Define all possible character that could into the string
    const possibleCharacter = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';
    for(i=1; i<=strLength; i++) {
      // get the random string from the possible character
      const randomCharacter = possibleCharacter.charAt(Math.floor(Math.random() * possibleCharacter.length));
      // Append the final randomCharacter to the str
      str+=randomCharacter;
    }
    return str;
  }
  return false;
};

helpers.sendTwilioSms = function (phone, msg, callback) {
  // Validate parameters
  phone = typeof (phone) == 'string' && phone.trim().length >= 10 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
  if (phone && msg) {

    // Configure the request payload
    const payload = {
      'From': config.twilio.fromPhone,
      'To': '+234' + phone,
      'Body': msg
    };
    const stringPayload = querystring.stringify(payload);


    // Configure the request details
    const requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code returned was ' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', (e) => {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

  } else {
    callback('Given parameters were missing or invalid');
  }
};

module.exports = helpers;
