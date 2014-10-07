
/*
 * Make Snapshot
 * Calls selenium service that generates
 * snapshots for all of defined browsers.
 * Saves results to Wizeye database.
 */

/*
 * Module dependencies.
 */

var config = require('./../config');
var Snapshot = require('./../schemas/snapshot');

var imageDiff = require('./../utilityScripts/imageDiff');
var request = require('request');
var crypto = require('crypto');
var async = require('async');
var fs = require('fs');

var snapshotUrl;

exports.execute = function(browsers, url, callback) {
    // call to selenium service with list of all browsers
    console.log('makeSnapshot - Executing call on selenium service for creating snapshots!');
    snapshotUrl = url;

    browsers = {
        'url': url,
        'requestedBrowsers': browsers
    };

    request.post(
        config.makeSnapshotSeleniumServiceURL,
        { form: browsers },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('makeSnapshot - Response from selenium service received!');
                var resultObject = JSON.parse(body);
                                // process results data
                processResponse(resultObject, findReferencedBrowser(browsers), callback);
            } else {
                console.log('makeSnapshot - ', error);
                callback({
                    success: false,
                    msg: 'No response from selenium service, ' + error
                });
            }
        }
    );
};

/*
 * Find Referenced Browser
 * Simple routine to find reference browser from list of given browsers
 */
function findReferencedBrowser(browsers) {
    var result;
    browsers.requestedBrowsers.forEach(function(item) {
        if (item.isReferenceBrowser) {
            result = item;
        }
    });
    return result;
};

function uniqueDateDependendHash() {
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    return crypto.createHash('sha1').update(current_date + random).digest('hex');
};

/*
 * Process Response - process the input, saves images to disk, calls createDiffs function
 * Required input consits of images per every browser
 * [{browserName, browserVersion, platform, imgSource}]
 */

function processResponse(results, referenceBrowser, callback) {
    console.log('makeSnapshot - processing selenium response!');

    // array containing snapshots for each browser
    var browserSnapshots = [];
    var convertBase64ToImages = {};

    if (results.snapshots.length > 0) {

        // ***************************************************************

        // 1. save all images from the feed localy on the server
        // - make delayed functions
        // base64 string must not contain meta type data on the begining
        var i = 0;
        results.snapshots.forEach(function(snapshot) {
            // make delayed function for async task
            // - must be async cus there are corner cases, where image convertion lasts longer than wrapping forEach itself
            convertBase64ToImages[i++] = function(callbackConversion) {
                // create unique name
                var uniqueName = snapshot.browserName + '_' + snapshot.browserVersion + '_' + snapshot.platform + '_' + uniqueDateDependendHash();
                uniqueName = uniqueName.replace(/ /g, '_');
                uniqueName += '.png';
                
                fs.writeFile('public/' + config.snapshotsFolder + '/' + uniqueName, new Buffer(snapshot.imgSource, "base64"), function(err) {
                    // get all snapshot data together
                    var isReferenceBrowser = snapshot.browserName == referenceBrowser.browserName &&
                                                snapshot.browserVersion == referenceBrowser.browserVersion &&
                                                snapshot.platform == referenceBrowser.platform;
                    if (err) {
                        console.log('makeSnapshot - error when converting base64 to images (', uniqueName, '): ', err);
                        browserSnapshots.push({
                            imagePath: uniqueName,
                            imageDiffPath: null,
                            browserName: snapshot.browserName,
                            browserVersion: snapshot.browserVersion,
                            platform: snapshot.platform,
                            percentage: null,
                            confirmed: false,   
                            isReferenceBrowser: isReferenceBrowser,
                            failure: true // additional failure flag
                        });
                        callbackConversion(null);
                    } else {
                        console.log('makeSnapshot - base64 string successfuly converted to image (', uniqueName, ')!');

                        browserSnapshots.push({
                            imagePath: uniqueName,
                            imageDiffPath: null,
                            browserName: snapshot.browserName,
                            browserVersion: snapshot.browserVersion,
                            platform: snapshot.platform,
                            percentage: null,
                            confirmed: false,
                            isReferenceBrowser: isReferenceBrowser
                        });

                        callbackConversion(null);
                    }
                });  
            };
        }); // end forEach

        // async execution of delayed functions
        console.log('makeSnapshot - async execution of "base64 to image" conversion!');
        async.parallel(
            convertBase64ToImages,
            function(err) {
                createDiffs(browserSnapshots, callback);
            }
        );

        // **************************************************************

    } else {
        // snapshots are of length 0, nothing to do
        console.log('makeSnapshot - no snapshots available!');
        // return general operation status to caller
        callback({
            success: false,
            msg: 'No snapshots available or returned from selenium service'
        });
    }
};

/*
 * Create Diffs - Create diffs between all snapshots and referenced snapshot
 * Save results to database
 */

function createDiffs(browserSnapshots, callback) {

    var imageDiffProcesses = {};

    // get reference browser from array containing all browser snapshots
    var referenceBrowser = findReferencedBrowser({
        requestedBrowsers: browserSnapshots
    });

    // 1. make diffs relative to reference browser snapshot - for easier reference point selection
    browserSnapshots.forEach(function(item) {
        if (item.imagePath !== referenceBrowser.imagePath) {
            console.log('makeSnapshot - pair ', referenceBrowser.imagePath , ' && ', item.imagePath);
            imageDiffProcesses[item.imagePath] = function(callbackDiffs) {
                imageDiff.execute(referenceBrowser.imagePath,
                                  item.imagePath,
                                  callbackDiffs);
            };
        }
    });

    console.log('makeSnapshot - Async execution of diff comparison!');

    async.parallel(
        imageDiffProcesses,
        function(err, results) {

            // 2. get image paths, save all data to database
            browserSnapshots.forEach(function(item) {
                if (results[item.imagePath]) {
                    var data = results[item.imagePath];
                    if (!data.failure) {
                        if (!data.same) {
                            item.imageDiffPath = data.urlToImageDiff;
                            item.percentage = data.percentage;
                            item.same = false;
                        } else {
                            item.same = true;
                        }
                    }
                }
            });

            // all ok... save it to dabatabase
            // delete all existing reference snapshots from database
            Snapshot.remove({}, function(err) {
                console.log('Removed all existing snapshots');
                // 3. save all data to database
                var record = new Snapshot({
                    url: snapshotUrl,
                    reference: true,
                    browserSnapshots: browserSnapshots
                });

                record.save(function(err, insertedObj) {
                    if (err) {
                        console.log('Snapshots insertion error! ', err);
                        callback({
                            success: false,
                            msg: 'Database insertion error: ' + err
                        });
                    } else {
                        // mapp folder for multicast
                        console.log('Snapshots created!');
                        callback({
                            success: true,
                            msg: 'Snapshots created!',
                            change: insertedObj
                        });
                    }
                });
            });
        }
    );

};
