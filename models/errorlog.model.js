let mongoose = require('mongoose');

// Video Schema
let errorlogSchema = mongoose.Schema({
  message: { type: String, required: true },
  posteddate: { type: Date, required: true },
  loation: {type: String, required: true}
});

let ErrorLog = module.exports = mongoose.model('ErrorLog', errorlogSchema);

