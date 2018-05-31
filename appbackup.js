const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const config = require('./config/database');
var sc2 = require('sc2-sdk');
const multer = require('multer');

let Video = require('./models/video');

var api = sc2.Initialize({
  app: 'steemporn.app',
  // callbackURL: 'http://localhost:8080/connect' ,
  callbackURL: 'http://54.38.207.246:8080/connect',
  scope: ['vote', 'comment']
});

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    if(path.extname(file.originalname) == ".mp4") {
      req.session.filename = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
      cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    } else {
      req.session.filename = file.fieldname + '-' + Date.now() + '.jpg';
      cb(null,file.fieldname + '-' + Date.now() + '.jpg');
    }
    
  }
});



const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000000},
  // fileFilter: function(req, file, cb){
  //   checkFileType(file, cb);
  // }
}).fields([
  { name: 'myFile', maxCount: 1 },
  { name: 'myThumb', maxCount: 1 }
]);

mongoose.connect(config.database);
let db = mongoose.connection;

// Check connection
db.once('open', function(){
  console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
  console.log(err);
});

// Init App
const app = express();

// Load View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());

app.use(bodyParser.text());
// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});



// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


app.get('*', function(req, res, next){
  res.locals.session = req.session || null;
  next();
});

// Home Route
app.get('/', function(req, res){
      res.render('index');
});

app.get('/login', function(req, res) {
  var state = req.query.state;
  var link = api.getLoginURL(state);
  res.writeHead(301, { Location: link });
  res.end();
});

app.get('/logout', function(req, res) {
  api.revokeToken(function (error, result) {
    req.session.username = null;
    res.redirect('/');
  });
});
 
app.get('/connect', function(req, res){
  var access_token = req.query.access_token;
  var expires_in = req.query.expires_in;
  var state = req.query.state;
  req.session.username = req.query.username;
  api.setAccessToken(access_token)
  state = state == 'index' ? '' : state;
  //console.log(username);
  //console.log(access_token);
  res.redirect('/'+state);
});

// Add Route
app.get('/upload', ensureAuthenticated, function(req, res){

    res.render('upload', {
      categoryList : [
        'Straight',
        'Lesbian',
        'Gay',
        'Hardcore',
        'Threesome',
        'Group',
        'Blow Job',
        'Asian',
        'Arabic',
        'Anal',
        'Ethenic',
        'Transexual',
        'Amateur'
      ] 
    });
  });


app.post('/upload', ensureAuthenticated, (req, res) => {
  upload(req, res, (err) => {
    if(err){
      res.status(500).send('Some Error Occured at Server');
    } else {
      res.send(req.session.filename);    
    }
  });
});

app.post('/upload/save', (req, res) => {
  //console.log(req.body)
  const SERVER = 'http://54.38.207.246:8080';
  // const SERVER = 'http://localhost:8080';
  
  let videoPost = new Video();
    videoPost.title = req.body.title,
    videoPost.content = req.body.content,
    videoPost.permlink = req.body.permlink,
    videoPost.thumbnail_path = req.body.thumbnail_path,
    videoPost.video_path = req.body.video_path,
    videoPost.video_width = req.body.video_width,
    videoPost.video_duration = req.body.video_duration,
    videoPost.tags = req.body.tags,
    videoPost.power_up = req.body.power_up,
    videoPost.author = req.session.username,
    videoPost.posteddate = new Date();

    const videotags = [];

    videotags.push('NSFW');
    videotags.push('dpornclassic');
    videotags.push('dpornclassicvideo');

    var jsonMetadata = JSON.stringify({
      tags: videotags,
      video: {
          video_path: videoPost.video_path,
          thumbnail_path: videoPost.thumbnail_path,
          video_width: videoPost.video_width,
          video_duration: videoPost.video_duration,
          categories: videoPost.tags,
          power_up: videoPost.power_up,
      },
      app: 'steemporn.app'
    })

    var content  = `<p style="text-align:center">
    <a href="${SERVER}/video/${videoPost.permlink}/${videoPost.author}" target="_blank">
    <img src="${SERVER}/uploads/${videoPost.thumbnail_path}" style="margin: 0 auto" /></a></p>${videoPost.content}`;


    api.comment('', 'dpornclassic', videoPost.author, videoPost.permlink, videoPost.title, content, jsonMetadata, function (err, result) {
      if(err) {
        res.status(500).json({ error: 'steem error'});
      }
      videoPost.save(function(err){
        if(err){
          console.log(err);
          res.status(500).json({ error: 'mongo error'});
          return;
        }
        //continue
        res.status(200).json({ result: 'success'});
      });
    });


  
});

// Access Control
function ensureAuthenticated(req, res, next){
  const allowed = ['sudguru', 'pranishg'];
  //console.log(req.session.username);
  if(req.session.username){
    if(allowed.indexOf(req.session.username)>=0)
    {
      return next();
    } else {
      req.flash('danger', 'Sorry You are not allowed to upload');
      res.redirect('/');
    }
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login?state=upload');
  }
}


module.exports = app;
