/**
 *  Create all helpers function
 */

// Dependencies
const crypto = require('crypto');
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
}

module.exports = helpers;
