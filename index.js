// Dependencies
const url = require('url');
const http = require('http');
const { StringDecoder } = require('string_decoder');

const server = http.createServer((req, res) => {
    // get the url and parse it
    const parsedUrl = url.parse(req.url, true);

    // get the path
    const path = parsedUrl.pathname;
    const trimPath = path.replace(/^\/+|\/+$/g, '');

    // get the HTTP verb/method
    const method = req.method.toLowerCase();

    // get the query params
    const queryStringObject = parsedUrl.query;

    // get the headers object
    const headers = req.headers;

    // get payload if any
    const decoder = new StringDecoder('utf8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        res.end(`Hello World!!\n\n  ${trimPath}\n\n`);
    });
});


server.listen(3000, () => {
    console.log('Server listening to port 3000');
});
