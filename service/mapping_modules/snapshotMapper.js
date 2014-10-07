
/*
 * Mapping module mongodb Snapshot object
 */

var SnapshotItemMapper = require('./snapshotItemMapper.js');

var SnapshotMapper = function () {
    this.id = null,
    this.userId = null,
    this.reference = null,
    this.browserSnapshots = null,
    this.date = null,
    this.url = null
};

// factory
module.exports = function (data) {
    var instance = new SnapshotMapper();

    instance.id = data._id.toString();
    instance.userId = data.userId;
    instance.reference = data.reference;
    instance.date = data.date ? data.date.getTime() : "";
    instance.url = data.url;
    instance.size = 0;

    // refactor all inner export items
    if (data.browserSnapshots) {
        instance.size = data.browserSnapshots.length;
        var hashm = {};
        data.browserSnapshots.forEach(function(snapshot) {
            var item = new SnapshotItemMapper(snapshot);
            hashm[item.id] = item;
        });

        instance.browserSnapshots = hashm;
    }

    return instance;
};