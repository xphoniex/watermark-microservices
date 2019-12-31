const Documents = require('../db/models/Documents')
const grpcSender = require('../grpc/sender')

const documentHandler = async (req, res) => {

  const document = req.body

  // pre-process
  if (!document.status || document.status === 'pending') {
    // make its status started and relay it to statuses service
    document.status = 'started'
    grpcSender.sendUpdate({ticket: document.ticket, status: document.status})
  }

  // process
  document.watermark = {
    content: document.content,
    title: document.title,
    author: document.author
  }
  document.content === 'book' ? document.watermark.topic = document.topic : null
  await Documents.updateOne(
    {
      ticket: document.ticket
    },
    {
      $set: {
        'watermark': document.watermark,
        //'status': 'finished',
      },
      $unset: {
        'content': 1,
        'topic': 1,
      }
    }
  )

  // post-process
  document.status = 'finished'
  grpcSender.sendUpdate({ticket: document.ticket, status: document.status})

  res.end('OK')
}

exports.documentHandler = documentHandler
