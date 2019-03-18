/**
 * Handle all request handlers
 */

 // Dependency
 const _data = require('./data');
 const helpers = require('./helpers');

 const handlers = {};

// Ping Handler
handlers.ping = (data, callback) => {
  callback(200);
}

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404, { 'Error': 'This route doesn\'t exsit' });
}

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
  const { phone } = data.queryStringObject;
  // validate query parameter
  const validPhone = typeof(phone) == 'string' && phone.trim().length >= 10 ? phone : false;
  if(validPhone) {
    // read the file an return users data
    _data.read('users', validPhone, (err, data) => {
      if(!err && data) {
        // Remove password for user details
        delete data.hashPassword;
        callback(200, data);
      } else {
        callback(404, {'Error': 'User not found'});
      }
    })

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
      _data.read('users', phone, (err, userData) => {
        if(!err && userData) {
          // Update the fields necessary
          if(firstName) {
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
            if(!err) {
              callback(200);
            } else {
              callback(500, {'Error': 'Could not update user inputs'});
            }
          });
        } else {
          callback(400, {'Error': 'Could not find user'})
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
    _data.read('users', validPhone, (err, data) => {
      if (!err && data) {
        // Delete user
        _data.delete('users', validPhone, (err) => {
          if(!err) {
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete user'});
          }
        });
      } else {
        callback(404, { 'Error': 'User not found' });
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

module.exports = handlers;
