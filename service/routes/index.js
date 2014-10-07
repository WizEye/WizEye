
/*
 * Module dependencies.
 */

var makeSnapshotService = require('./../services/makeSnapshot');
var historyComparator = require('./../services/historyComparator');
var snapshotModule = require('./../modules/snapshotModule');

/*
 * GET home page.
 */

exports.index = function(req, res) {
    res.render('index', { title: 'Wizeye Service' });
};

/************************************************************************************/

/*
 * POST 'make snapshot' request. Calls selenium service that generates
 * snapshots for all of defined browsers.
 * Saves results to Wizeye database.
 * Deletes all existing snapshoots from database.
 */

exports.makesnapshots = function(req, res) {
    console.log('/makesnapshots called');
    var browsersListWithUrl = req.body;
    
    if (browsersListWithUrl.requestedBrowsers) {

        makeSnapshotService.execute(browsersListWithUrl.requestedBrowsers, browsersListWithUrl.url, function(status) {
                res.setHeader('Content-Type', 'application/json');
                res.jsonp({
                    status: status
                });
            }
        );
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.jsonp({
            status: {
                success: false,
                msg: 'No browser list defined'
            }
        });
    }
};

/*
 * POST gets snapshots for confirmation.
 */

exports.getsnapshotsforconfirmation = function(req, res) {
    console.log('/getsnapshotsforconfirmation called');
    snapshotModule.getSnapshotsForConfirmation(function(results) {
        res.setHeader('Content-Type', 'application/json');
        res.jsonp({
            success: results.success,
            data: results.success ? results.data : results.msg
        });
    });
};

/*
 * POST confirms snapshot with given id
 */

exports.confirmsnapshot = function(req, res) {
    console.log('/confirmsnapshot called');
    var snapshot = req.body;
    snapshotModule.confirmSnapshot(snapshot, function(result) {
        res.setHeader('Content-Type', 'application/json');
        res.jsonp({
            success: result.success,
            data: result.success ? result.cnt : result.msg
        });
    });
};

/*
 * POST compares current snapshots with confirmed snapshots from database.
 * Makes request to selenium, compares results with saved and confirmed snapshots.
 * Saves results.
 */

exports.compare = function(req, res) {
    // TODO make request to selenium, get snapshots only for confirmed snapshots
    // TODO compare received snapshots with confirmed snapshots from database
    // return results - save results to database
    // console.log('TODO / Make snapshot call on selenium, compare tham with confirmed snapshots');

    console.log('/compare called');

    // get confirmed snapshots reference
    snapshotModule.getConfirmedSnapshots(function(snapshots) {
        if (snapshots.success) {
            // 1. calls selenium for new snapshots
            // 2. runs comparing service by history
            // 3. saves results to database (new table?)
            // 4. returns status
            historyComparator.execute(snapshots.data, function(status) {
                res.setHeader('Content-Type', 'application/json');
                res.jsonp({
                    status: status
                });
            });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.jsonp({
                success: snapshots.success,
                data: snapshots.msg
            });
        }
    });
};