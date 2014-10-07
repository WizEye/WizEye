
/*
 * Mapping module mongodb Snapshot mapper object
 */

var SnapshotItemMapper = function () {
    this.id = null,
    this.browserName = null,
    this.browserVersion = null,
    this.confirmed = null,
    this.failure = null,
    this.imageDiffPath = null,
    this.imagePath = null,
    this.platform = null,
    this.isReferenceBrowser = null,
    this.same = null
};

// factory
module.exports = function (data) {
    var instance = new SnapshotItemMapper();

    instance.id = data._id.toString();
    instance.browserName = data.browserName;
    instance.browserVersion = data.browserVersion;
    instance.confirmed = data.confirmed;
    instance.failure = data.failure;
    instance.imageDiffPath = data.imageDiffPath;
    instance.imagePath = data.imagePath;
    instance.platform = data.platform;
    instance.isReferenceBrowser = data.isReferenceBrowser;
    instance.same = data.same;
    
    return instance;
};