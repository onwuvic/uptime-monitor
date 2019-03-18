/**
 * Creating and editing data
 */

 // Dependencies
 const fs = require('fs');
 const path = require('path');
 const helpers = require('../lib/helpers');

// Container for the module to be exported
const lib = {};

// Base directory for the data folder
lib.baseDir = path.join(__dirname, '/../.data');

// Write data to file
lib.create = (dir, file, data, callback) => {
  //Open the file for writing
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if(!err) {
          fs.close(fileDescriptor, (err) => {
            if(!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create file. It may already exist');
    }
  });
};

// Read data from file
lib.read = (dir, file, callback) => {
  fs.readFile(`${lib.baseDir}/${dir}/${file}.json`, 'utf8', (err, data) => {
    if(!err && data) {
      const parsedObject = helpers.parseJsonToObject(data);
      callback(false, parsedObject);
    } else {
      callback(err, data);
    }
  });
};

// Updating file
lib.update = (dir, file, data, callback) => {
  //open the file
  fs.open(`${lib.baseDir}/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
    if(!err && fileDescriptor) {
      // Convert the data to string
      const stringData = JSON.stringify(data);

      //Truncate the file
      fs.ftruncate(fileDescriptor, (err) => {
        if(!err) {
          // Write the file and close it
          fs.writeFile(fileDescriptor, stringData, (err) => {
            if(!err) {
              fs.close(fileDescriptor, (err) => {
                if(!err) {
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              })
            } else {
                callback('Error writing to file');
            }
          });
        } else {
            callback('Error truncating file');
        }
      })
    } else {
        callback('Could not open file for updating. It may not exist');
    }
  });
};

// Delete
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(`${lib.baseDir}/${dir}/${file}.json`, (err) => {
        if(!err) {
            callback(false);
        } else {
            callback('Error deleting file');
        }
    });
}

module.exports = lib;
