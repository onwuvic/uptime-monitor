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
     'secrete': 'secrete123'
 };

 // Production environment
 environments.production = {
     'httpPort': 5000,
     'httpsPort': 5001,
     'envName': 'production',
     'secrete': 'secrete123'
 };

 // Determine which environment is passed the command-line argument
 const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() :  '';

 // Check if the current environment is stated above else default to development
 const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.development;

 // export the module
 module.exports = environmentToExport;