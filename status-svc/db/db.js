const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb.watermark/watermark'

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useCreateIndex:true,
  autoIndex: true,
  useUnifiedTopology: true
}).catch(err => { console.error(err); process.exit(1); })

exports.connection = mongoose.connection
