const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const sc2 = require('sc2-sdk');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config/database');
const generalData = require('./config/generalData');
var rfs = require('rotating-file-stream')

mongoose.connect(config.database);
let db = mongoose.connection;

// Check DB connection & Error 
db.once('open', function(){
  console.log('Connected to MongoDB');
});
db.on('error', function(err){
  console.log(err);
});
const myCronJob = require('./myCronJob');
var CronJob = require('cron').CronJob;
new CronJob('*/5 * * * *', myCronJob, null, true, 'America/Los_Angeles');


// Init App
const app = express();
app.set('env', 'development');
//steemconnect v2 api
SCapi = sc2.Initialize({
  app: 'steemporn.app',
  callbackURL: generalData.SERVER_NAME + '/auth',
  scope: ['vote', 'comment', 'delete_comment', 'comment_options', 'custom_json', 'claim_reward_balance']
});

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body Parser parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware with connect-mongoose
app.use(session({
  secret: 'my top secret',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { expires: 604800 }
}));



//Morgan logging
var logDirectory = path.join(__dirname, 'logs/logx')
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
})
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res), '--',
    tokens.url(req, res), '--',
    tokens.status(req, res), '--',
    tokens.res(req, res, 'content-length'), '--',
    'username' , '--',
    new Date() , '--',
    tokens['response-time'](req, res), 'ms'
  ].join(' ')
}, {stream: accessLogStream}));

app.get('*', function(req, res, next){
    res.locals.username = req.session.username || null;
    res.locals.SERVER_NAME = generalData.SERVER_NAME;
    let access_token = req.session.token || null;
    console.log('ssss', access_token);
    SCapi.setAccessToken(access_token)
    next();
});

let site = require('./routes/site.routes');
let auth = require('./routes/auth.routes');
let upload = require('./routes/upload.routes');
let private = require('./routes/private.routes');
let admin = require('./routes/canupload.routes');
app.use('/', site);
app.use('/auth', auth);
app.use('/upload', upload);
app.use('/private', private);
app.use('/admin', admin);

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
  res.send(err.message);
});


module.exports = app;
