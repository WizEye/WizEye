
/*
 * Snapshot Module
 * General database functions
 */

/*
 * Module dependencies.
 */

var config = require('./../config');
var Snapshot = require('./../schemas/snapshot');
var SnapshotMapper = require('./../mapping_modules/snapshotMapper');
var SnapshotItemMapper = require('./../mapping_modules/snapshotItemMapper');

/*
 * Gets snapshots for confirmation]
 * TODO: it works ONLY PER ONE SAME USER currently,
 * returns all database content, because makeSnapshots service
 * deletes all database content, while creating starting snapshots.
 */
exports.getSnapshotsForConfirmation = function(callback) {
    Snapshot.findOne({ reference: true }).lean().exec(function(err, item) {
        if (err) {
            console.log('Mongodb: error when retrieving Snapshot item');
            callback({
                success: false,
                msg: 'Error while requesting Snapshot items: ' + err
            });
        } else {
            console.log('Mongodb: Snapshot item retrieved!');
            var snapshot = new SnapshotMapper(item);
            callback({
                success: true,
                data: snapshot
            });
        }
    });
}

/*
 * Gets snapshots for confirmation]
 * TODO: it works ONLY PER ONE SAME USER currently,
 * returns all database content, because makeSnapshots service
 * deletes all database content, while creating starting snapshots.
 */
exports.getConfirmedSnapshots = function(callback) {
    Snapshot.findOne({ reference: true }).lean().exec(function(err, item) {
       if (err) {
            console.log('Mongodb: error when retrieving Snapshot item');
            callback({
                success: false,
                msg: 'Error while requesting Snapshot items: ' + err
            });
        } else {
            console.log('Mongodb: Snapshot item retrieved!');
            var snapshot = new SnapshotMapper(item);
            callback({
                success: true,
                data: snapshot
            });
        } 
    });
}

exports.confirmSnapshot = function(snapshot, callback) {
    // snapshot.id
    // snapshot.checked
    Snapshot.update(
        {"browserSnapshots._id": snapshot.id},
        {$set: { "browserSnapshots.$.confirmed": snapshot.checked }},
        {safe: true, upsert: true},
        function(err, cntOfUpdated) {
            if (err) {
                console.log('Error while updating confirmed status, ' + err);
                callback({
                    success: false,
                    msg: 'Error while updating confirmed status, ' + err
                });
            } else {
                console.log('Updated snapshot item with id: ', snapshot.id);
                callback({
                    success: true,
                    cnt: cntOfUpdated
                });
            }
        }
    );
}