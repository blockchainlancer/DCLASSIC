let mongoose = require('mongoose');

// Video Schema
let videoSchema = mongoose.Schema({
  title: { type: String, required: true },
  permlink: { type: String, required: true },
  author: { type: String, required: true },
  content: { type: String, required: true },
  thumbnail_path: { type: String, required: true },
  video_path: { type: String, required: true },
  video_width: { type: Number, required: true },
  video_duration: { type: Number, required: true },
  power_up: { type: Number, required: true },
  tags: { type: String, required: false },
  posteddate: { type: Date, required: true },
  payment: { type: Number, required: false }
});

let Video = module.exports = mongoose.model('Video', videoSchema);

