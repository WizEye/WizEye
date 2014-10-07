var grid = require('selenium-grid');
var webdriver = require('selenium-webdriver');
var async = require('async')

//storage for all web drivers
var drivers = [];

//hub config
var hub = {
	ip: 'http://localhost:5000/wd/hub'
};

/*
* list supported browsers
* format: 'browserNameKey': {seleneium_settings_for_browser}
*/
var browsers = 
{
	'GoogleChrome35.0.1916.153OSX10.9.4': {'browserName': 'chrome'},
	'Mozilla30.0Windows': {'browserName': 'firefox'}
};

/*
* Initialize browsers from the array of all supported browsers
*/
exports.init = function()
{
	for (var browser in browsers) 
	{
	   	//get settings from browsers array under current key
		var settings = browsers[browser];

	    //fill the drivers with key of the browsers array so it is accessible by name
		drivers[browser] = new webdriver.Builder().
	      usingServer(hub.ip).
	      withCapabilities(settings).
	      build();

	    drivers[browser].manage().window().setSize(1280, 720);
		
		console.log(" [" + Date.now() + "] " + browser + ' init with settings: ' + JSON.stringify(settings));
	}
}


/*
* Navigate the browser to the url
* @param url: navigate to url
*/
exports.surf = function(url, callback)
{
	var taskQuee = {};

	//putting functions on quee for async paraller - read the docs
	for (var driver in drivers)
	{
		(function(curDriver) 
		{
			//create objects with browser keys and functions to be executed
			taskQuee[curDriver] = function(callback)
			{
				drivers[curDriver].get(url).then(function()
				{
		            callback(null, true);
		            console.log(" [" + Date.now() + "] " + curDriver + ' navigation to url succeed: ' + url);
		        },
		        function()
		        {
		            callback(null, false);
		            console.log("![" + Date.now() + "] " + curDriver + ' navigation to url FAILED: ' + url);
        		});
			}
		})(driver);
	}

	async.parallel(taskQuee, function(err, results) 
	{
		callback(results);
	});
}

/*
* Screenshot the browser
* @param callback: function that is called after command executes
*/
exports.capture = function(requestedBrowsers, callback)
{
	if (requestedBrowsers == undefined)
		return false;

	var taskQuee = {};

	//putting functions on quee for async paraller - read the docs
	for (var driver in drivers)
	{
		(function(curDriver) 
		{
			//if current browser is in requested browsers make screenshot
			for (var curBrowser in requestedBrowsers)
			{
				var browserName = this.hashBrowser(requestedBrowsers[curBrowser]);

				//create objects with browser keys and functions to be executed
				if (curDriver == browserName)
				{
					taskQuee[curDriver] = function(callback)
					{		
						drivers[curDriver].takeScreenshot().then(function(response)
						{
							console.log(" [" + Date.now() + "] taking screenshot with browser: " + curDriver);
							callback(null, response);
						});
					}
				}	
			}
		})(driver);
	}

	//execute quee for paralel execution
	async.parallel(taskQuee, function(err, results) 
	{
		console.log(" [" + Date.now() + "] Done taking screenshots");

		var response = {
			snapshots: []
		};
		var index = 0;

		/*
		* formatting the result object
		*/
		for (var browserResult in results)
		{
			//creates response the same as request
			var item = {};
			
			for (key in requestedBrowsers[index])
				item[key] = requestedBrowsers[index][key];

			//append image source
			item.imgSource = results[browserResult];
			response.snapshots[index] = item;

			index ++;
		}

		callback(response);
	});
}

/*
* Select the webelement on screen with css selector
* @param selector: css selector to specify element
* @param callback: function to be called after screenshot is taken
*/
exports.selector = function(selector, callback)
{	
	var response = {};

	//search for element specified in post.selector
	drivers[agent].findElement(webdriver.By.css(selector)).then(function(element) 
	{
		//get the location of element specified in selector
		element.getLocation().then(function(location)
		{
			response.x = location.x;
			response.y = location.y;

		}).then(function()
		{		
			//get the size of element specified in selector
			element.getSize().then(function(size)
			{
				response.width = size.width;
				response.height = size.height;
			});
		});

		response.fail = false;
	},
	function()
	{
		//if element is not found
		response.fail = true;
	}).then(function()
	{
		callback(response);
	});	
}

/*
* Close the webdrivers
*/
exports.close = function(callback)
{
	var taskQuee = {};

	//putting functions on quee for async paraller - read the docs
	for (var driver in drivers)
	{
		console.log("![" + Date.now() + "] closing browsers and ending sessions");
		drivers[driver].close();
		drivers[driver].quit();
		drivers[driver] = null;
	}

	//wait for browsers to shutdown before exit
	setTimeout(callback, 4000); 
}


hashBrowser = function(browser)
{
	var hash = "";

	for (var key in browser)
	{
		if (key === "isReferenceBrowser" || key === "checked")
			continue;

		var item = browser[key].split(' ').join('');
		hash = hash.concat(item);
	}

	return hash;
}