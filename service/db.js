
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/WizeyeDB');

mongoose.connection
    .on('connected', function () {
        console.log('Connection to mongodb SUCCESSFUL!');
    })
    .on('error', function (err) {
        console.log('Connection to mongodb FAILED: ', err);
    });

module.exports = mongoose.connection;