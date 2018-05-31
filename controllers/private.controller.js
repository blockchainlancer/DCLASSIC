const steem = require('steem');
const moment = require("moment");
const generalData = require('../config/generalData');

exports.upVote = (req, res, next) => {
  let voter = req.params.username;
  let author = req.params.author;
  let permlink = req.params.permlink;
  SCapi.vote(voter, author, permlink, 10000, function (err, response) {
    console.log('eee', err);
    if (err) {
      res.status(200).send({
        error: err.message,
        result: null
      })
    } else {
      res.status(200).json({
        error: null,
        result: voter
      });
    }
  });
}


exports.followAuthor = (req, res, next) => {
  let follower = req.params.username;
  let following = req.params.author;
  SCapi.follow(follower, following, function (err, result) {
    console.log('eee', err);
    if (err) {
      res.status(200).send({
        error: err.message,
        result: null
      });
    } else {
      res.status(200).send({
        error: null,
        result: 'success'
      });
    }
  });
}

exports.sendGift = (req, res, next) => {
  var sendto = req.params.sendto;
  var amount = req.params.amount;
  var currency = req.params.currency
  var permlink = req.params.permlink;
  var amtText = amount + ' ' + currency;
  //var callbackURL = `${generalData.SERVER_NAME}/video/${permlink}/${sendto}`;
  var callbackURL = `${generalData.SERVER_NAME}`;

  var link = SCapi.sign('transfer', {
    to: sendto, 
    amount: amtText,
    memo: 'Gift Via DPORNCLASSIC!',
  }, callbackURL);
  //console.log(callbackURL)
  res.writeHead(301, {
    Location: link
  });

  res.end();
}

exports.listHistory = (req, res, next) => {
  let history = [];
  res.render('listing', {
    title: "History",
    videos: history
  });
}


exports.listLiked = (req, res, next) => {
  let liked = [];
  res.render('listing', {
    title: "History",
    videos: liked
  });
}


exports.listWatchLater = (req, res, next) => {
  let watchlater = [];
  res.render('listing', {
    title: "History",
    videos: watchlater
  });
}