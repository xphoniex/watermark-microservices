'use strict'

const mongoose = require('mongoose')
const { Schema } = mongoose

const DocumentsSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  watermark: Object,
  topic: String,
  content: String,
  ticket: { type: String, index: true, unique: true, required: true },
  status: { type: String, default: 'pending' },
})

module.exports = mongoose.model('Documents', DocumentsSchema)
