const generalData = require('../config/generalData');
const steem = require('steem');
const moment = require("moment");

const Video = require('../models/video.model');
const Hot = require('../models/hot.model');
const Trending = require('../models/trending.model');

// Home Route
exports.showHomePage = (req, res, next) => {
  latests = [];
  trending = [];
  hot = [];
  getCreated()
  .then(getHot)
  .then(getTrending)
  .then(() => {
    res.render('index', { latests, hot, trending })
  });
}


exports.showCategoryPage = (req, res, next) => {
  
}


exports.showProfilePage = (req, res, next) => {
  const author = req.params.author;
  av = [];
  Video.find({"author": author}, function(err, videos){
    if(err){
      logError(err, 'Site author video find 33');
    } else {
      //tasks
      av = videos.map(video => {
        posted = moment(video.posteddate).fromNow();
        duration = moment.utc(video.video_duration*1000).format('mm:ss');
        const v = {
          title: video.title,
          thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
          videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
          duration: duration,
          author: video.author,
          payment: '$ ' + video.payment,
          posted: posted,
          permlink: video.permlink
        }
        return v;
      });
    }
    console.log(av)
  });

  steem.api.getAccounts([author], function(err, response){

    cover_image='/imgs/cover.jpg';
    about = '';
    profile_image = 'https://img.busy.org/@'+author;
    location = '';
    name = author;
    if(response[0].json_metadata) {
      json_metadata = JSON.parse(response[0].json_metadata);
      //console.log(json_metadata);
      cover_image = `https://steemitimages.com/2048x512/${json_metadata.profile.cover_image}`
      about = json_metadata.profile.about;
      profile_image = json_metadata.profile.profile_image;
      location = json_metadata.profile.location
      name = json_metadata.profile.name
    }
    balance = response[0].balance;
    sbd_balance = response[0].sbd_balance;

    var secondsago = (new Date - new Date(response[0].last_vote_time + "Z")) / 1000;
    var vpow = response[0].voting_power + (10000 * secondsago / 432000);
    var VP = Math.min(vpow / 100, 100).toFixed(2);

    steem.api.getFollowCount(author, function(err1, result) {
      steem.api.getFollowers(author, 'a', 'blog', result.follower_count, function(err2, result2) {
        
      });
      
      res.render("profile", { 
        author: author,
        cover_image: cover_image,
        voting_power: VP,
        location: location,
        profile_image: profile_image,
        about: about,
        videos: av,
        follower_count: result.follower_count,
        following_count: result.following_count,
        balance: balance,
        sbd_balance: sbd_balance,
        name: name

      });
    });
    
  });
}


exports.showVideoPage = (req, res, next) => {
  const author = req.params.author;
  const permlink = req.params.permlink;
  steem.api.getContent(author, permlink, function(err, result) {
    json_metadata = JSON.parse(result.json_metadata);
    paymentValue = parseFloat(result.total_payout_value) +
                        parseFloat(result.curator_payout_value) +
                        parseFloat(result.pending_payout_value);

    posted = moment(result.created).fromNow();
    duration = moment.utc(json_metadata.video.video_duration*1000).format('mm:ss'),
    pv = '$ ' + paymentValue.toFixed(2);
      let video = {
        title: result.title,
        thumbnail : generalData.SERVER_NAME + '/uploads/' + json_metadata.video.thumbnail_path,
        videopath : generalData.SERVER_NAME + '/uploads/' + json_metadata.video.video_path,
        duration: duration,
        author: result.author,
        payment: pv,
        posted: posted,
        permlink: permlink
    }
    var voters = "";
    var voters_count = 0;
    result.active_votes.forEach(ac => {
      if(ac.percent > 0) {
        voters_count++;
        voters += '<span class="left" style="line-height: 20px">' + ac.voter + '</span><br>';
      }
    })
    //console.log(voters)
    tags = json_metadata.video.categories.split(",");
    steem.api.getFollowCount(author, function(err2, result2) {
      follower_count = result2.follower_count;
      res.render('video', { video, voters, voters_count, tags, follower_count });
    });
  });
}


exports.listHotVideos = (req, res, next) => {
  Hot.find({}, function(err, videos){
    if(err){
      logError(err, 'Site hot find 120');
    } else {
      //tasks
      hot = videos.map(video => {
        posted = moment(video.posteddate).fromNow();
        duration = moment.utc(video.video_duration*1000).format('mm:ss');
        const v = {
          title: video.title,
          thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
          videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
          duration: duration,
          author: video.author,
          payment: '$ ' + video.payment,
          posted: posted,
          permlink: video.permlink
        }
        return v;
      });
      res.render('listing', { title: "Hot Videos", videos: hot })
    }
  });
}


exports.listTrendingVideos = (req, res, next) => {
  var query = {
    limit: 50,
  };
  Trending.find({}, function(err, videos){
    if(err){
      logError(err, 'Site hot find 120');
    } else {
      //tasks
      trending = videos.map(video => {
        posted = moment(video.posteddate).fromNow();
        duration = moment.utc(video.video_duration*1000).format('mm:ss');
        const v = {
          title: video.title,
          thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
          videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
          duration: duration,
          author: video.author,
          payment: '$ ' + video.payment,
          posted: posted,
          permlink: video.permlink
        }
        return v;
      });
      res.render('listing', { title: "Trending Videos", videos: trending })
    }
  });
}


exports.listNewVideos = (req, res, next) => {
  var query = {
    limit: 50,
    sort: '-posteddate'
  };

  Video.find({}).sort({"posteddate": -1}).exec(function(err, videos){
    if(err){
      logError(err, 'Site hot find 205');
    } else {
      //tasks
      latests = videos.map(video => {
        posted = moment(video.posteddate).fromNow();
        duration = moment.utc(video.video_duration*1000).format('mm:ss');
        const v = {
          title: video.title,
          thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
          videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
          duration: duration,
          author: video.author,
          payment: '$ ' + video.payment,
          posted: posted,
          permlink: video.permlink
        }
        return v;
      });
      res.render('listing', { title: "New Videos", videos: latests })
    }
  });
}


const getCreated = function() {
  const promise = new Promise(function(resolve, reject) {
    var query = {
      limit: 10,
    };
    Video.find({}).sort({"posteddate": -1}).exec(function(err, videos){
      if(err){
        logError(err, 'Site Video Find 87')
        resolve(0)
      } else {
        //tasks
        latests = videos.map(video => {
          posted = moment(video.posteddate).fromNow();
          duration = moment.utc(video.video_duration*1000).format('mm:ss');
          const v = {
            title: video.title,
            thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
            videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
            duration: duration,
            author: video.author,
            payment: '$ ' + video.payment,
            posted: posted,
            permlink: video.permlink
          }
          return v;
        });
        console.log('latests', latests)
        resolve(1)
      }
    });
  });
  return promise;
};

const getHot = function() {
  const promise = new Promise(function(resolve, reject) {
    var query = {
      limit: 10,
    };
    Hot.find({}, function(err, videos){
      if(err){
        logError(err, 'Site hot find 120');
        resolve(0)
      } else {
        //tasks
        hot = videos.map(video => {
          posted = moment(video.posteddate).fromNow();
          duration = moment.utc(video.video_duration*1000).format('mm:ss');
          const v = {
            title: video.title,
            thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
            videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
            duration: duration,
            author: video.author,
            payment: '$ ' + video.payment,
            posted: posted,
            permlink: video.permlink
          }
          return v;
        });
        resolve(1)
      }
    });
  });
  return promise;
};

const getTrending = function() {
  const promise = new Promise(function(resolve, reject) {
    var query = {
      limit: 10,
    };
    Trending.find({}, function(err, videos){
      if(err){
        logError(err, 'Site Trending Find 153');
        resolve(0)
      } else {
        //tasks
        trending = videos.map(video => {
          posted = moment(video.posteddate).fromNow();
          duration = moment.utc(video.video_duration*1000).format('mm:ss');
          const v = {
            title: video.title,
            thumbnail : generalData.SERVER_NAME + '/uploads/' + video.thumbnail_path,
            videopath : generalData.SERVER_NAME + '/uploads/' + video.video_path,
            duration: duration,
            author: video.author,
            payment: '$ ' + video.payment,
            posted: posted,
            permlink: video.permlink
          }
          return v;
        });
        resolve(1)
      }
    });
  });
  return promise;
};

const logError = function(err, location) {
  let error = new ErrorLog();
  error.message = err.message;
  error.location = location
  error.posteddate = new Date();
  error.save();
}