
/*
 * Make History ComparableSnapshot
 * Calls selenium service that generates
 * snapshots for all of defined browsers by history.
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

var snapshotUrl = null;
var referenceBrowsersList = null;
var referenceData = null;

exports.execute = function(data, callback) {
    // call to selenium service with list of all browsers
    console.log('historyComparator - Executing call on selenium service for creating snapshots!');
    
    referenceData = data;
    snapshotUrl = referenceData.url;
    referenceBrowsersList = {
        'url': snapshotUrl,
        'requestedBrowsers': getReferenceBrowsersList(referenceData.browserSnapshots)
    };

    request.post(
        config.makeSnapshotSeleniumServiceURL,
        { form: referenceBrowsersList },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('historyComparator - Response from selenium service received!');
                var resultObject = JSON.parse(body);
                // process results data
                processResponse(resultObject, callback);
            } else {
                console.log('historyComparator - ', error);
                callback({
                    success: false,
                    msg: 'No response from selenium service, ' + error
                });
            }
        }
    );
};

function getReferenceBrowsersList(dataList) {
    var result = [];
    Object.keys(dataList).forEach(function(key) {
        var item = dataList[key];
        if (item.confirmed) {
            result.push({
                browserName: item.browserName,
                browserVersion: item.browserVersion,
                platform: item.platform
            });
        }
    });
    return result;
};

function findReferencedImagePath(relItem) {
    var imagePath;
    Object.keys(referenceData.browserSnapshots).forEach(function(key) {
        var item = referenceData.browserSnapshots[key];
        if (item.browserName == relItem.browserName &&
            item.browserVersion == relItem.browserVersion &&
            item.platform == relItem.platform) {
            imagePath = item.imagePath;
        }
    });
    return imagePath;
}

/*
 * Find Referenced Browser
 * Simple routine to find reference browser from list of given browsers
 */
// function findReferencedBrowser(browsers) {
//     var result;
//     browsers.requestedBrowsers.forEach(function(item) {
//         if (item.isReferenceBrowser) {
//             result = item;
//         }
//     });
//     return result;
// };

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

function processResponse(results, callback) {
    console.log('historyComparator - processing selenium response!');

    // array containing snapshots for each browser
    var browserSnapshots = [];
    var convertBase64ToImages = {};

    if (results.snapshots.length > 0) {

        // ***************************************************************

        // 1. save all images from the feed localy on the server
        // - make delayed functions
        // op.: base64 string must not contain meta type data on the begining
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
                    if (err) {
                        console.log('historyComparator - error when converting base64 to images (', uniqueName, '): ', err);
                        browserSnapshots.push({
                            imagePath: uniqueName,
                            imageDiffPath: null,
                            browserName: snapshot.browserName,
                            browserVersion: snapshot.browserVersion,
                            platform: snapshot.platform,
                            percentage: null,
                            confirmed: false,   
                            failure: true // additional failure flag
                        });
                        callbackConversion(null);
                    } else {
                        console.log('historyComparator - base64 string successfuly converted to image (', uniqueName, ')!');

                        browserSnapshots.push({
                            imagePath: uniqueName,
                            imageDiffPath: null,
                            browserName: snapshot.browserName,
                            browserVersion: snapshot.browserVersion,
                            platform: snapshot.platform,
                            percentage: null,
                            confirmed: false,
                        });

                        callbackConversion(null);
                    }
                });  
            };
        }); // end forEach

        // async execution of delayed functions
        console.log('historyComparator - async execution of "base64 to image" conversion!');
        async.parallel(
            convertBase64ToImages,
            function(err) {
                // when done, create diffs related to reference point browsers
                createDiffs(browserSnapshots, callback);
            }
        );

        // **************************************************************

    } else {
        // snapshots are of length 0, nothing to do
        console.log('historyComparator - no snapshots available!');
        // return general operation status to caller
        callback({
            success: false,
            msg: 'No snapshots available or returned from selenium service'
        });
    }
};

/*
 * Create Diffs - Create diffs between new and referenced snapshots
 * Save results to database
 */

function createDiffs(browserSnapshots, callback) {

    var imageDiffProcesses = {};

    // 1. make diffs relative to reference browser snapshot - for easier reference point selection
    browserSnapshots.forEach(function(item) {
        var pathToReference = findReferencedImagePath(item);
        imageDiffProcesses[item.imagePath] = function(callbackDiffs) {
            imageDiff.execute(
                pathToReference,
                item.imagePath,
                callbackDiffs
            );
        };
    });

    console.log('historyComparator - Async execution of diff comparison!');
    async.parallel(
        imageDiffProcesses,
        function(err, results) {

            // 2. get new image paths, save all data to database
            browserSnapshots.forEach(function(item) {
                if (results[item.imagePath]) {
                    var data = results[item.imagePath];
                    if (!data.failure) {
                        item.confirmed = true; // flag has no meaning here
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
            
            // 3. save all data to database
            var record = new Snapshot({
                url: snapshotUrl,
                reference: false,
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
            
        }
    );
};
