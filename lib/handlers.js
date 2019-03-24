/**
 * Handle all request handlers
 */

 // Dependency
 const _data = require('./data');
 const helpers = require('./helpers');
 const config = require('./config');

 const handlers = {};

// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for user handlers
handlers._users = {};

// User - post
// Required data: firstname, lastname, phone, password, tosAgrement
// Optional Data: none
handlers._users.post = (data, callback) => {
  // Check all the required field are passed
  const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
  const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
  const tosAgrement = typeof (data.payload.tosAgrement) == 'boolean' && data.payload.tosAgrement == true ? true : false;

  if(firstName && lastName && phone && password && tosAgrement) {
    // check if the data already exist
    _data.read('users', phone, (err, data) => {
      if (err) {
        // hash password
        const hashPassword = helpers.hash(password);
        if (hashPassword) {
          const userData = {
              firstName, lastName, phone, hashPassword, tosAgrement
          };
          _data.create('users', phone, userData, (err) => {
            if (!err) {
              callback(200, {'Success': 'Created user'});
            } else {
              callback(500, { 'Error': 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { 'Error': 'Could not hash user\'s password' });
        }
      } else {
        // User already exist
        callback(400, { 'Error': 'User with this phone already exist' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required fields'});
  }
};

// User - get
// Required data: ?phone=09038393993
// Optional Data: none
handlers._users.get = (data, callback) => {
  let { phone } = data.queryStringObject;
  // validate query parameter
  phone = typeof(phone) == 'string' && phone.trim().length >= 10 ? phone : false;
  if(phone) {
    // Get the token from the header
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is for the given phone number
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if(tokenIsValid) {
        // read the file an return users data
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            // Remove password for user details
            delete data.hashPassword;
            callback(200, data);
          } else {
            callback(404, { 'Error': 'User not found' });
          }
        });
      } else {
        callback(403, {'Error':'Missing required header token or token expires'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// User - get
// Required data: phone
// Optional Data: firstname, lastname, password
handlers._users.put = (data, callback) => {
  // Validate user input
  const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
  const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  if(phone) {
    // check at least one input is passed in
    if(firstName || lastName || password) {
      // Lookup the user by phone
      // Get the token from the header
      const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token is for the given phone number
      handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              // Update the fields necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                const hashPassword = helpers.hash(password);
                userData.hashPassword = hashPassword;
              }
              // Store the new data
              _data.update('users', phone, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { 'Error': 'Could not update user inputs' });
                }
              });
            } else {
              callback(400, { 'Error': 'Could not find user' })
            }
          });
        } else {
          callback(403, { 'Error': 'Missing required header token or token expires' });
        }
      });
    } else {
      callback(400, {'Error': 'Missing required field'});
    }
  } else {
    callback(400, {'Error': 'Missing required field'});
  }
};

// User - delete
// Required data: ?phone=09038393993
// Optional Data: none
handlers._users.delete = (data, callback) => {
  const { phone } = data.queryStringObject;
  // validate query parameter
  const validPhone = typeof (phone) == 'string' && phone.trim().length >= 10 ? phone : false;
  if (validPhone) {
    // read the file an return users data
    // Get the token from the header
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is for the given phone number
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', validPhone, (err, userData) => {
          if (!err && data) {
            // Delete user
            _data.delete('users', validPhone, (err) => {
              if (!err) {
                // Delete each of the checks associated with the user
                const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                const checksToDelete = userChecks.length;
                if(checksToDelete > 0){
                  let checksDeleted = 0;
                  const deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach((checkId) => {
                    // Delete the check
                    _data.delete('checks',checkId,(err) => {
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        } else {
                          callback(500,{'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."})
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { 'Error': 'Could not delete user' });
              }
            });
          } else {
            callback(404, { 'Error': 'User not found' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required header token or token expires' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Token
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if(acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for token
handlers._tokens = {};

// Token - post
// Required data: phone and password
// Optional Data: none
handlers._tokens.post = (data, callback) => {
  const phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length >= 10 ? data.payload.phone : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

  if(phone && password) {
    // Read the user data
    _data.read('users', phone, (err, userData) => {
      if(!err) {
        // Compare if the password match
        const hashPassword = helpers.hash(password);
        if(hashPassword == userData.hashPassword) {
          // Create a token with a random name and an expiring time (1 hour)
          const tokenId = helpers.generateRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            id: tokenId,
            phone,
            expires
          }

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if(!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not create new token'})
            }
          });
        } else {
          callback(400, {'Error' : 'Incorrect password'});
        }
      } else {
        callback(404, {'Error': 'User not found'});
      }
    });
  } else {
    callback(500, {'Error': 'Missing required fields'});
  }
};

// Token - get
// Required data: ?id=3kd303003030
// Optional Data: none
handlers._tokens.get = (data, callback) => {
  let { id } = data.queryStringObject;
  id = typeof(id) == 'string' && id.trim().length == 20 ? id : false;
  if(id) {
    _data.read('tokens', id, (err, tokenData) => {
      if(!err) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400)
  }
};

// Token - put
// Required data: id and extend
// Optional Data: none
handlers._tokens.put = (data, callback) => {
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
  const extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

  if(id && extend) {
    _data.read('tokens', id, (err, tokenData) => {
      if(!err && tokenData) {
        if(tokenData.expires > Date.now()){
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens', id, tokenData, (err) => {
            if(!err) {
              callback(200, tokenData);
            } else {
              callback(500, {'Error':'Could not update token'});
            }
          })
        } else {
          callback(400, {'Error':'Token expired, Can\'t be extended'});
        }
      } else {
        callback(404, {'Error': 'token doesn\'t exist'});
      }
    });
  } else {
    callback(400, {'Error':'Missing required fields'});
  }
};

// Token - delete
// Required data: id
// Optional Data: none
handlers._tokens.delete = (data, callback) => {
  let { id } = data.queryStringObject;
  id = typeof(id) == 'string' && id.trim().length == 20 ? id : false;
  if(id) {
    _data.read('tokens', id, (err) => {
      if(!err) {
        _data.delete('tokens', id, (err) => {
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error':'Could not delete token'});
          }
        });
      } else {
        callback(404, {'Error':'Token not found'});
      }
    });
  } else {
    callback(400, {'Error':'Invalid id supplied'});
  }
};

// Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for all the checks
handlers._checks = {};

// Check - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional Data: none
handlers._checks.post = (data, callback) => {
  // Validate user input
  let { protocol, url, method, successCodes, timeoutSeconds } = data.payload;
  protocol = typeof(protocol) == 'string' && ['http', 'https'].indexOf(protocol) > -1 ? protocol : false;
  url = typeof(url) == 'string' && url.trim().length > 0 ? url : false;
  method = typeof(method) == 'string' && ['put', 'delete', 'post', 'get'].indexOf(method) > -1 ? method : false;
  successCodes = typeof(successCodes) == 'object' && successCodes instanceof Array && successCodes.length > 0 ? successCodes : false;
  timeoutSeconds = typeof (timeoutSeconds) == 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >= 1 && timeoutSeconds <= 5 ? timeoutSeconds : false;

  if(protocol && url && method && successCodes && timeoutSeconds) {
    // Check header token
    let { token } = data.headers;
    token = typeof(token) == 'string' ? token : false;
    // Lookup the token
    _data.read('tokens', token, (err, tokenData) => {
      if(!err && tokenData) {
        const { phone } = tokenData;
        // Lookup user by phone
        _data.read('users', phone, (err, userData) => {
          if(!err && userData) {
            const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // Verify the user has the max checks per user
            if(userChecks.length < config.maxChecks) {
              // Create a random id for the check
              const checkId = helpers.generateRandomString(20);

              // Create check object and include checkId
              const checkObject = {
                checkId,
                phone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              }

              // Save check object
              _data.create('checks', checkId, checkObject, (err) => {
                if(!err) {
                  // update the user data with the checks
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // save the new user data
                  _data.update('users', phone, userData, (err) => {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {'Error':'Could not update user data'})
                    }
                  });
                } else {
                  callback(500, {'Error': 'Could not create check'});
                }
              });
            } else {
              callback(400, {'Error': `User has reach the maximum ${config.maxChecks} checks`})
            }
          } else {
            callback(403)
          }
        });
      } else {
        callback(403)
      }
    });
  } else {
    callback(400, {'Error': 'Missing Input or Invalid input'});
  }
};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function(data,callback){
  // Check that id is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the check
    _data.read('checks',id,(err,checkData) => {
      if(!err && checkData){
        // Get the token that sent the request
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.phone,(tokenIsValid) => {
          if(tokenIsValid){
            // Return check data
            callback(200,checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

// Checks - put
// Required data: id
// Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
handlers._checks.put = function(data,callback){
  // Check for required field
  const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  // Check for optional fields
  const protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  const method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  // Error if id is invalid
  if(id){
    // Error if nothing is sent to update
    if(protocol || url || method || successCodes || timeoutSeconds){
      // Lookup the check
      _data.read('checks',id,(err,checkData) => {
        if(!err && checkData){
          // Get the token that sent the request
          const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token,checkData.phone,(tokenIsValid) => {
            if(tokenIsValid){
              // Update check data where necessary
              if(protocol){
                checkData.protocol = protocol;
              }
              if(url){
                checkData.url = url;
              }
              if(method){
                checkData.method = method;
              }
              if(successCodes){
                checkData.successCodes = successCodes;
              }
              if(timeoutSeconds){
                checkData.timeoutSeconds = timeoutSeconds;
              }

              // Store the new updates
              _data.update('checks',id,checkData,(err) => {
                if(!err){
                  callback(200);
                } else {
                  callback(500,{'Error' : 'Could not update the check.'});
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{'Error' : 'Check ID did not exist.'});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }
};

// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function(data,callback){
  // Check that id is valid
  const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the check
    _data.read('checks',id,(err,checkData) => {
      if(!err && checkData){
        // Get the token that sent the request
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.phone,(tokenIsValid) => {
          if(tokenIsValid){
            // Delete the check data
            _data.delete('checks',id,(err) => {
               if(!err){
                // Lookup the user's object to get all their checks
                _data.read('users',checkData.phone,(err,userData) => {
                  if(!err){
                    const userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    // Remove the deleted check from their list of checks
                    const checkPosition = userChecks.indexOf(id);
                    if(checkPosition > -1){
                      userChecks.splice(checkPosition,1);
                      // Re-save the user's data
                      userData.checks = userChecks;
                      _data.update('users',checkData.phone,userData,(err) => {
                         if(!err){
                          callback(200);
                        } else {
                          callback(500,{'Error' : 'Could not update the user.'});
                        }
                      });
                    } else {
                      callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                    }
                  } else {
                    callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                  }
                });
              } else {
                callback(500,{"Error" : "Could not delete the check data."})
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400,{"Error" : "The check ID specified could not be found"});
      }
    });
  } else {
    callback(400,{"Error" : "Missing valid id"});
  }
};

// Verify a given token is for a given user
// Required: id and phone
handlers._tokens.verifyToken = (id, phone, callback) => {
  // Loook up token
  _data.read('tokens', id, (err, tokenData) => {
    if(!err && tokenData) {
      // Check that phone is for the given user and the token has not expired
      if(tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


// Ping Handler
handlers.ping = (data, callback) => {
  callback(200);
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404, { 'Error': 'This route doesn\'t exsit' });
};

module.exports = handlers;
