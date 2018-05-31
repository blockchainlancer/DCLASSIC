const steem = require('steem');
const moment = require('moment');
let Video = require('./models/video.model');
let Hot = require('./models/hot.model');
let Trending = require('./models/trending.model');
let ErrorLog = require('./models/errorlog.model');
mongovideos = [];


const myCronJob = () => {
  console.log("every 5 secs");
  Video.find({}, function(err, videos){
    if(err){
      logError(err, 'Cron Vido Find 14');
    } else {
      //tasks
      mongovideos = videos;
      Trending.remove({}).exec();
      Hot.remove({}).exec();
      manageCreated();
      manageTrending();
      manageHot();
    }
  });
}

const logError = function(err, location) {
  let error = new ErrorLog();
  error.message = err.message;
  error.location = location
  error.posteddate = new Date();
  error.save();
}

const manageCreated = function() {
    var query = {
      tag: 'dpornclassicupload',
      limit: 50,
      truncate_body: 1
    };
    steem.api.getDiscussionsByCreated(query, function(err, result) {
      if(!err) {
        result.forEach( steemvideo => {
          payment =  parseFloat(steemvideo.total_payout_value) +
                          parseFloat(steemvideo.curator_payout_value) +
                          parseFloat(steemvideo.pending_payout_value);
          var found = mongovideos.find(v => {
            return v.permlink === steemvideo.permlink
          });
          if(found) {
            Video.update({ permlink: found.permlink }, { payment: payment }, (err) => {
              if(err) { 
                logError(err, 'Cron Video Created Update 53'); 
              } 
            });
          }
        });
      } else {
        logError(err, 'Cron Steem Created fetch 59')
      }
    });
};

const manageTrending = function() {
  var modifiedtrendings = [];
  var query = {
    tag: 'dpornclassicupload',
    limit: 50,
    truncate_body: 1
  };
  steem.api.getDiscussionsByTrending(query, function(err, trendings) {

    if(!err) {
      trendings.forEach(element => {
        json_metadata = JSON.parse(element.json_metadata);
        paymentValue = parseFloat(element.total_payout_value) +
                            parseFloat(element.curator_payout_value) +
                            parseFloat(element.pending_payout_value);

        posted = moment(element.created).fromNow();
        //duration = moment.utc(json_metadata.video.video_duration*1000).format('mm:ss')
        duration = json_metadata.video.video_duration;
        power_up = json_metadata.video.power_up
        pv = paymentValue.toFixed(2);
        posteddate = element.created;
          let item = {
            title: element.title,
            thumbnail_path: json_metadata.video.thumbnail_path,
            video_duration: duration,
            author: element.author,
            payment: pv,
            posted: posted,
            permlink: element.permlink,
            content: '',
            video_path: '',
            video_width: 0,
            power_up: 0,
            posteddate: posteddate
          }
          modifiedtrendings.push(item);
      });
      Trending.collection.insert(modifiedtrendings, function (err, docs) {
        if (err){ 
          logError(err, 'Cron Trending Insert to mongo 105')
        } else {
          deleteUnwanted('trendings', trendings);
        }
      });
    } else {
      logError(err, 'Cron Steem Trending fetch 111')
    }
  });

  

};

const manageHot = function() {
  var modifiedhots = [];
  var query = {
    tag: 'dpornclassicupload',
    limit: 50,
    truncate_body: 1
  };
  steem.api.getDiscussionsByHot(query, function(err, hots) {
    if(!err) {
      hots.forEach(element => {
        json_metadata = JSON.parse(element.json_metadata);
        paymentValue = parseFloat(element.total_payout_value) +
                            parseFloat(element.curator_payout_value) +
                            parseFloat(element.pending_payout_value);

        posted = moment(element.created).fromNow();
        //duration = moment.utc(json_metadata.video.video_duration*1000).format('mm:ss')
        duration = json_metadata.video.video_duration;
        power_up = json_metadata.video.power_up
        pv = paymentValue.toFixed(2);
        posteddate = element.created;
          let item = {
            title: element.title,
            thumbnail_path: json_metadata.video.thumbnail_path,
            video_duration: duration,
            author: element.author,
            payment: pv,
            posted: posted,
            permlink: element.permlink,
            content: '',
            video_path: '',
            video_width: 0,
            power_up: 0,
            posteddate: posteddate
          }
          modifiedhots.push(item);
      });
      Hot.collection.insert(modifiedhots, function (err, docs) {
        if (err){ 
          logError(err, 'Cron Hot insert to mongo 158')
        } else {
          deleteUnwanted('hots', hots);
        }
      });
    } else {
      logError(err, 'Cron Steem Hot fetch 164')
    }
  });

  
};

const deleteUnwanted = function(task, data) {
  if(task === 'trendings')
  {
    data.forEach( trending => {
      var found = mongovideos.find(v => v.permlink === trending.permlink);
      if(!found) {
        Trending.remove({ permlink: trending.permlink}).exec();
      }
    });
  } else {
    data.forEach( hot => {
      var found = mongovideos.find(v => v.permlink === hot.permlink);
      if(!found) {
        Hot.remove({ permlink: hot.permlink}).exec();
      }
    });
  } 

  
}

module.exports = myCronJob;