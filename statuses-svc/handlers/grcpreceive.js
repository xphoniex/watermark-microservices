const Documents = require('../db/models/Documents')

global.statuses = [] // cache for statuses
const MAX_CACHED = 200 // approx. half of this number, actually

const grcpReceiveHandler = (update) => {
  console.log({update})
  // update status in db while avoiding race-conditions
  const priors = { 'started': ['pending'], 'finished': ['pending', 'started'] }
  Documents.updateOne(
    { ticket: update.ticket, status: { $in: priors[update.status] } },
    { $set: { status: update.status } }
  ).then().catch(console.error)

  // append log to status cache
  global.statuses.push({
    ticket: update.ticket,
    status: update.status,
    timestamp: parseInt(Date.now() / 1000) // could be nice for a dashboard
  })
  global.statuses = global.statuses.slice(global.statuses.length - MAX_CACHED)
}


exports.grcpReceiveHandler = grcpReceiveHandler
