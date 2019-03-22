// Dependencies
const url = require('url');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');
const config = require('./lib/config');
const helpers = require('./lib/helpers');
const handlers = require('./lib/handlers');

// Initialize HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Start server and listen to port for HTTP
httpServer.listen(config.httpPort, () => {
  console.log(`Server listening to port ${config.httpPort} on ${config.envName} mode`);
});

// Initialize HTTPS Server
const httpsServerOption = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};

// Start server and listen to port for HTTPS
const httpsServer = https.createServer(httpsServerOption, (req, res) => {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(`Server listening to port ${config.httpsPort} on ${config.envName} mode`);
});

// unified server for both http and https
const unifiedServer = (req, res) => {
  /**
   * @descriptions get the url and parse it
   * @http localhost:3000/api/v1/signup
   * @returns Url {
    protocol: null,
    slashes: null,
    auth: null,
    host: null,
    port: null,
    hostname: null,
    hash: null,
    search: null,
    query: [Object: null prototype] {},
    pathname: '/api/v1/signup',
    path: '/api/v1/signup',
    href: '/api/v1/signup' }
    */
  const parsedUrl = url.parse(req.url, true);

  /**
   * @descriptions get the path
   * @output '/api/v1/signup'
   */
  const path = parsedUrl.pathname;

  /**
   * @descriptions this remove the first '/'
   * @output 'api/v1/signup'
   */
  const trimPath = path.replace(/^\/+|\/+$/g, '');


  /**
   * @descriptions get the HTTP verb/method convert to lower case
   * @output 'get', 'post', 'put', 'delete' 'head'
   */
  const method = req.method.toLowerCase();

  /**
   * @descriptions get the query params
   * @input localhost:3000/api/v1/signup?action=decline&par=2
   * @output [Object: null prototype] { action: 'decline', par: '2' }
   */
  const queryStringObject = parsedUrl.query;

  /**
   * @descriptions get the headers object
   * @input localhost:3000/api/v1/signup
   * @output
   */
  // {
  //   'x-access-token': 'eyJhbGXVCJ9.eyJ1FtZSI6IsImV4cCI6MTU0Ben39rn-l1wqktH3KQaYHmYuqWftlf8',
  //   'content-type': 'application/x-www-form-urlencoded',
  //   'cache-control': 'no-cache',
  //   'postman-token': '5c2-90e2-45d5-fd88',
  //   'user-agent': 'PostmanRuntime/7.6.0',
  //   accept: '*/*',
  //   host: 'localhost:3000',
  //   cookie: 'connect.sid=s%3ASxh6V_Mo0555ZekB7zT6FV.Jb3JK%0',
  //   'accept-encoding': 'gzip, deflate',
  //   'content-length': '44',
  //   connection: 'keep-alive'
  // }
  const headers = req.headers;

  /**
   * @description get payload if any
   * Node handles incoming request as streams
   * Convert the streeam into readable format
   */
  const decoder = new StringDecoder('utf8');
  let buffer = '';
  req.on('data', (data) => {
      buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler that will handle this request
    const chosenHandler = typeof (router[trimPath]) !== 'undefined' ? router[trimPath] : handlers.notFound;

    const data = {
      trimPath,
      queryStringObject,
      method,
      headers,
      // Parse the payload json string to an object
      'payload': helpers.parseJsonToObject(buffer)
    };

    // data and function (callback(200, {paylod}))
    chosenHandler(data, (statusCode, payload) => {
      // The payload here is what is being return not what was gotten

      // Use the status code called by the handler or default to 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

      // Use the payload called by the handler or default to an empty object
      payload = typeof (payload) == 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      //set header to return only json
      res.setHeader('Content-Type', 'application/json');
      // Return the response
      res.writeHead(statusCode);
      res.end(payloadString);

      //log the payload
      console.log('The request', statusCode, payloadString);
    });
  });
}

// Define a request router
const router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
};
