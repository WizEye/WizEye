
var mongoose = require('mongoose');

// this file only exports mongoose module
module.exports = mongoose.model('Snapshot', {
    // TODO not required yet  - add when needed - refactor for multiuser usage
    userId: { type: String, default: 'unknown' }, // user id
    url: String, // url of a page where snapshot was taken
    date: { type: Date, default: Date.now }, // insertion time
    reference: { type: Boolean, default: false }, // is this snapshot package taken as reference one or not
    browserSnapshots: [{
        imagePath: String, // path to snapshot image
        imageDiffPath: String, // path to snapshot diff (with reference snapshot)
        imageDiffPercentage: Number, // 
        browserName: String, // browser name - firefox, chrome, safari etc.
        browserVersion: String, // browser version - 6.0, 6.1 etc.
        platform: String, // platform, where snapshot was taken - windows, linux, osx
        confirmed: { type: Boolean, default: false }, // snapshot confirmation flag
        isReferenceBrowser: { type: Boolean, default: false }, // browser, where the snapshot was triggered
        same: { type: Boolean, default: true }, // diffs equality
        failure: { type: Boolean, default: false } // failure on specific browser
    }]
});