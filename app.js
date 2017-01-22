var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flock = require('flockos');

var index = require('./routes/index');
var wolframUtil = require('./utils/wolfram-util');
var config = require('config');
var fs = require('fs');

var app = express();

flock.setAppId(config.get("flockApp.botGuid"));
flock.setAppSecret(config.get("flockApp.appSecret"));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);

// Read tokens from a local file, if possible.
var tokens;
try {
  tokens = require('tokens.json');
} catch (e) {
  tokens = {};
}

// save tokens on app.install
flock.events.on('app.install', function (event) {
  tokens[event.userId] = event.token;
});

// delete tokens on app.uninstall
flock.events.on('app.uninstall', function (event) {
  delete tokens[event.userId];
});

//on chat.receiveMessage
flock.events.on('chat.receiveMessage', function(event){
    new wolframUtil().get(event.message.text, function(ret, retRaw){
        var attachment = [];
        if(ret == "")
            ret = "I don't know how to interpret your input.";
        if(retRaw.Img)
            attachment.push({"views":{"widget":{"src":retRaw.Img[0],"width": retRaw.Img[1],"height": retRaw.Img[2]}}})
        flock.callMethod('chat.sendMessage', config.get("flockApp.botGuid"), {'to': event.userId, 'flockml': ret,
            'text':event.message.text, 'attachments': attachment });
    });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// exit handling -- save tokens in token.js before leaving
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('exit', function () {
  fs.writeFileSync('tokens.json', JSON.stringify(tokens));
});

module.exports = app;
