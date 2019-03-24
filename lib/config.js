/**
 *  Create and export configuration variables
 *
 */

 // Container for all the environments
 const environments = {};

 // Development (default) environment
 environments.development = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'development',
  'secrete': 'secrete123',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone': '+15005550006'
  }
 };

 // Production environment
 environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'secrete': 'secrete123',
  'maxChecks': 5,
  'twilio': {
    'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone': '+15005550006'
  }
 };

 // Determine which environment is passed the command-line argument
 const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() :  '';

 // Check if the current environment is stated above else default to development
 const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.development;

 // export the module
 module.exports = environmentToExport;
