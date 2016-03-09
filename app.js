var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var settings = require('./settings.js');
var apiRoutes = require('./apiRoutes');

var app = express();

app.set('superSecret', settings.secret);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRoutes);


//connet to MongoDB
var connect = function() {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(settings.mongodbUrl, options);
};
connect();

mongoose.connection.on('error', console.log);
//try to reconnect to mongodb when disconnected
//TODO 如果链接失败会一直重新连接，设置一个重连次数，超过次数后就不再尝试。
mongoose.connection.on('disconnected', connect);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

module.exports = app;
