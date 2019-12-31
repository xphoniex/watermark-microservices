'use strict'

const mongoose = require('mongoose')
const { Schema } = mongoose

const CheckpointsSchema = new Schema({
  type: { type: String, unique: true, required: true },
  timestamp: { type: Number, required: true },
})

module.exports = mongoose.model('Checkpoints', CheckpointsSchema)
