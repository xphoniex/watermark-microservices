const db = require('./db/db')
const express = require('express')
const mongoose = require('mongoose')
const Documents = require('./db/models/Documents')
const bodyParser = require('body-parser')
const Checkpoints = require('./db/models/Checkpoints')
const sendToBroker = require('./utils/poster')

const app = express()
app.use(bodyParser.json({ limit: '1mb' }))

const createCheckpoint = (timestamp, type = 'retry-checkpoint') => {
  return new Promise((resolve, reject) => {
    new Checkpoints({ timestamp, type }).save()
    .then(resolve)
    .catch(reject)
  })
}

const updateCheckpoint = (timestamp, type = 'retry-checkpoint') => {
  return new Promise((resolve, reject) => {
    Checkpoints.updateOne({ type }, { $set: { timestamp } })
    .then(resolve)
    .catch(reject)
  })
}

const getCheckpoint = (type = 'retry-checkpoint') => {
  return new Promise((resolve, reject) => {
    Checkpoints.findOne({ type })
    .then(resolve)
    .catch(reject)
  })
}

const getUnfinishedJobs = (checkpoint, until) => {
  return new Promise((resolve, reject) => {
    console.log({checkpoint, until})

    const RETRY_PER_CRON = process.env.RETRY_PER_CRON || 100
    Documents.find(
      {
        timestamp: { $gt: checkpoint, $lt: until },
        status: { $ne: 'finished' },
        //watermark: { $exists: false }
      }
    )
    .limit(RETRY_PER_CRON)
    .then(resolve)
    .catch(reject)
  })
}

const updateJobTimestamp = (_id) => {
  return new Promise((resolve, reject) => {
    const timestamp = parseInt(Date.now() / 1000)
    Checkpoints.updateOne({ _id }, { $set: { timestamp } })
    .then(resolve)
    .catch(reject)
  })
}

const finalizeDocumentStatus = (_id) => {
  return new Promise((resolve, reject) => {
    Documents.updateOne({ _id }, { $set: { status: 'finished' } })
    .then(resolve)
    .catch(reject)
  })
}

const logTimed = (msg) => {
  const time = new Date().toLocaleTimeString()
  console.log(`[${time}]`, msg)
}

const checkpointTail = () => {
  const LOOK_BACK_PERIOD = process.env.LOOK_BACK_PERIOD || 5 * 60
  return parseInt((Date.now() - LOOK_BACK_PERIOD) / 1000)
}

const checkpointHead = () => {
  return new Promise(async (resolve, reject) => {
    let checkpoint = await getCheckpoint()
    if (!checkpoint) {
      await createCheckpoint(0)
      checkpoint = 0
    } else {
      checkpoint = checkpoint.timestamp
    }
    resolve(checkpoint)
  })
}

const run = async () => {
  const tail = checkpointTail()
  const jobs = await getUnfinishedJobs((await checkpointHead()), tail)

  if (!jobs.length)
    logTimed(`no unfinished jobs, exiting after setting checkpoint.`)

  for (let i = 0 ; i < jobs.length ; ++i) {
    let job = jobs[i]

    if (job.watermark) {
      // watermark has been processed but status is stuck, finalize it here
      await finalizeDocumentStatus(job._id)
      continue
    }

    // move the job to the end of queue
    await updateJobTimestamp(job._id)
    // emit job's event
    sendToBroker(job)
  }

  const newCheckpoint = jobs.length ? jobs[jobs.length - 1].timestamp : tail
  updateCheckpoint(newCheckpoint)
  .then(() => logTimed(`new checkpoint: ${newCheckpoint}`))
  .catch(console.error)
}

app.post('/', (req, res) => {
  run()
  res.end('OK')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`serving requests on port ${PORT}`))
