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
}

module.exports = helpers;
