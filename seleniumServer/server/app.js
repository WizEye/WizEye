
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var grid = require('selenium-grid');
var webdriver = require('selenium-webdriver');
var driver = require('./driver');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

/*
 * Driver initialization - start selenium grid and set drivers configuration
*/
driver.init();

/*
  Get the status of service    
*/
app.get('/', function(req, res)
{
    returnJSON(JSON.stringify("status: listening"), res);
});

/*
    NAVIGATION navigate to given url
    request format: {"url": "string"}
*/
app.all('/navigation', function(req, res)
{
    var data = req.body;
    var response = {};

    driver.surf(data.url, function(result)
    {   
        console.log(" [" + Date.now() + "] navigation completed: " + result);
        returnJSON(result, res);
    });
});

/*
  SCREENSHOT - take screenshot of requested browsers
  request format: 
  '{"url":"requested url",
    "requestedBrowsers": [{"browserName": "string",
                           "browserVersion": "string",
                           "platform": "string", 
                           "isReferenceBrowser": "boolean"}]}
*/
app.post('/screenshot', function(req, res)
{
    var data = req.body;

    //first navigate and then take screenshots
    driver.surf(data.url, function(result)
    {      
        driver.capture(data.requestedBrowsers, function(image)
        {
            returnJSON(image, res);
        });      
    });
});

/*
    SELECTOR - select element on the screen and get the data
*/
app.post('/selector', function(req, res) 
{
    var data = req.body;
    
    driver.selector(data.selector, function(response)
    {
        returnJSON(response, res);
    });

    console.log(" [" + Date.now() + "] " + browser + 'getting the webelement with selector: ' + data.selector);
});

app.listen(2000, function()
{
    console.log("![" + Date.now() + "] " + 'listening on port 2000');
});

process.on('SIGINT', function() 
{
    console.log("![" + Date.now() + "] " + 'sigint catched, safely closing application');
    
    driver.close(function()
    {
        console.log("![" + Date.now() + "] " + 'application finished')
        process.exit();        
    });

});

/*
* Helper methods
*/
function returnJSON(response, res)
{
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
}

function returnImage(image, res)
{
    res.setHeader('Content-Type', 'text/html');
    res.end('<img alt="screenshot" src="data:image/png;base64,'+image+'" />');
}
