
/*
 * Image Diff
 * Check if there are any differences between two of the given images.
 * Makes a diff between image_a and image_b, saves it and returns the image path.
 */

var config = require('./../config');
var pngparse = require('pngparse');
var exec = require('child_process').exec;

// callback requests [urlToImageDiff, status]
exports.execute = function(imageReferenced, imageToCompare, asyncCallback) {
    var imageReferencedFull = 'public/' + config.snapshotsFolder + '/' + imageReferenced;
    var imageToCompareFull = 'public/' + config.snapshotsFolder + '/' + imageToCompare;

    // check if images are the same, asyncCallback contains logic, executed when sameImage function is finished
    sameImage(imageReferencedFull, imageToCompareFull, function(result) {
        if (result.failure) {
            // FAILURE
            asyncCallback(null, {
                failure: true
            });
        } else if (result.same) {
            // SAME IMAGE
            console.log('imageDiff - There are no differences in ' + imageReferenced + ' to ' + imageToCompare + ' comparison!');
            asyncCallback(null, {
                same: true
            });
        } else {
            // DIFF IN IMAGE
            
            // color dif
            var diff = 'diff_' + imageReferenced.replace('.png','') + '&&' + imageToCompare.replace('.png','') + '.png';
            var diffFull = 'public/' + config.snapshotsFolder + '/' + diff;
            
            var diff_cmd = 'compare -dissimilarity-threshold 1 -metric MAE png:"' + imageReferencedFull + '" png:"' + imageToCompareFull + '" png:"' + diffFull + '"';
            console.log('imageDiff - There are differences found! Generating image diff: ', diffFull);
            exec(diff_cmd, function(error) {
                console.log('imageDiff - Generated diff. Special info: ', error);
            });

            // diff gif
            var diff2 = 'diff_' + imageReferenced.replace('.png','') + '&&' + imageToCompare.replace('.png','') + '.gif';
            var diffFull2 = 'public/' + config.snapshotsFolder + '/' + diff2;

            var diff_cmd2 = 'convert -delay 200 -loop 0 "' + imageReferencedFull + '" "' + imageToCompareFull + '" "' + diffFull2 + '"';
            console.log('imageDiff - There are differences found! Generating image diff 2: ', diffFull2);
            exec(diff_cmd2, function(error) {
                console.log('imageDiff - Generated diff 2. Special info: ', error);
            });

            asyncCallback(null, {
                same: false,
                urlToImageDiff: diff,
                percentage: result.percentage
            });
        }
    });
};

/*
 * Same Image
 * Check if images are the same with simple/fast pixle by pixle comparison
 */
function sameImage(imageReferenced, imageToCompare, callback) {
    pngparse.parseFile(imageReferenced, function(err, imageA) {
        if (err) {
            console.log('imageDiff - Error parsing given imageReferenced! ', err);
            return callback({
                failure: true
            });
        }
        pngparse.parseFile(imageToCompare, function(err, imageB) {
            if (err) {
                console.log('imageDiff - Error parsing given imageToCompare! ', err);
                return callback({
                    failure: true
                });
            }

            // Simple size check
            if (imageA.data.length !== imageB.data.length) {
                return callback({
                    same: false,
                    percentage: null
                });
            }

            // Loop over pixels, but skip 4th alpha propery as these images should not be transparent
            var damagedPxCnt = 0;
            for (var i = 0, len = imageA.data.length; i < len; i += 4) {
                if (imageA.data[i]     !== imageB.data[i] ||
                    imageA.data[i + 1] !== imageB.data[i + 1] ||
                    imageA.data[i + 2] !== imageB.data[i + 2]) {
                        damagedPxCnt++;
                }
            }
            if (damagedPxCnt > 0) {
                callback({
                    same: false,
                    percentage: damagedPxCnt/imageB.data.length * 100
                });
            } else {
                callback({
                    same: true,
                    percentage: damagedPxCnt/imageB.data.length * 100
                });
            }
        });
    });
}