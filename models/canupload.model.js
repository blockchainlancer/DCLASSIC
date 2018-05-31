let mongoose = require('mongoose');

// Video Schema
let canUploadSchema = mongoose.Schema({
  username: { type: String, required: true },
});

let CanUpload = module.exports = mongoose.model('CanUpload', canUploadSchema);

