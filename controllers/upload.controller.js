const multer = require('multer');
const path = require('path');

const generalData = require('../config/generalData');

let Video = require('../models/video.model');

_this = this
selectedFileName = '';


const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function(req, file, cb){
    if(path.extname(file.originalname) == ".mp4") {
      selectedFileName= file.fieldname + '-' + Date.now() + path.extname(file.originalname);   
    } else {
      selectedFileName = file.fieldname + '-' + Date.now() + '.jpg';
    }
    cb(null,selectedFileName);
  }
});


const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000000},
}).fields([
  { name: 'myFile', maxCount: 1 },
  { name: 'myThumb', maxCount: 1 }
]);



exports.showUploadForm = function(req, res, next){
  res.render('upload', { categoryList: generalData.categoryList });
}


exports.uploadVideo = function(req, res, next) {
  upload(req, res, (err) => {
    if(err){
      res.status(500).send('Some Error Occured at Server');
    } else {
      res.send(selectedFileName);    
    }
  });
}


exports.savePost = async function(req, res, next) {
  let videoPost = new Video();
  videoPost.title = req.body.title;
  videoPost.content = req.body.content;
  videoPost.permlink = req.body.permlink;
  videoPost.thumbnail_path = req.body.thumbnail_path;
  videoPost.video_path = req.body.video_path;
  videoPost.video_width = req.body.video_width;
  videoPost.video_duration = req.body.video_duration;
  videoPost.tags = req.body.tags;
  videoPost.power_up = req.body.power_up;
  videoPost.author = req.session.username;
  videoPost.posteddate = new Date();
  videoPost.payment = 0;    

  const videotags = [];

  videotags.push('nsfw');
  videotags.push('dpornclassic');
  videotags.push('dpornclassicupload');

  var jsonMetadata = {
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
  }
  //const jsonMetadata = {};
  //console.log(jsonMetadata);

  let p_s_d = 10000;
  if (videoPost.power_up === 50) {
    p_s_d = 10000;
  } else {
    p_s_d = 0;
  }

  var content  = `<p style="text-align:center">
  <a href="${generalData.SERVER_NAME}/video/${videoPost.permlink}/${videoPost.author}" target="_blank">
  <img src="${generalData.SERVER_NAME}/uploads/${videoPost.thumbnail_path}" style="margin: 0 auto" /></a></p>${videoPost.content}`;

  const comment_params = {
    parent_author: '',
    parent_permlink: 'dpornclassic',
    author: videoPost.author,
    permlink: videoPost.permlink,
    title: videoPost.title,
    body: content,
    json_metadata : JSON.stringify(jsonMetadata)
  };

  const comment_options_params = {
    author: videoPost.author,
    permlink: videoPost.permlink,
    max_accepted_payout: '1000000.000 SBD',
    percent_steem_dollars: p_s_d,
    allow_votes: true,
    allow_curation_rewards: true,
    extensions: [
      [0, {
        beneficiaries: [
          { account: 'dpornclassic', weight: 2500 }
        ]
      }]
    ]
  };

  //, ['comment_options', comment_options_params]
  SCapi.broadcast([['comment', comment_params], ['comment_options', comment_options_params]], function (err, result) {
    if(err) {
      console.log(err);
      res.status(500).json({ error: 'steem error'});
      res.end();
    } else {
      videoPost.save(function(err){
        if(err){
          console.log(err);
          res.status(500).json({ error: 'mongo error'});
          return;
        }
        //continue
        res.status(200).json({ result: 'success'});
      });
    }
  });

}


