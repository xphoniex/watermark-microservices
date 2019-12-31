const Documents = require('../db/models/Documents')
const { UserInputError } = require('apollo-server')
const { sendToBroker } = require('../utils/poster')
const { createHash } = require('crypto')

module.exports = {
  Mutation: {
    watermark: async(parent, { document }, _, __) => {
      // validate content field
      if (document.content !== 'book' && document.content !== 'journal')
        throw new UserInputError('content can only be book or journal.')

      // validate for books
      if (document.content === 'book' || document.topic) {
        if (document.content !== 'book')
          throw new UserInputError('topic is only applicable for books.')

        if (!document.topic)
          throw new UserInputError('books must have a topic specified.')

        if (!(document.topic.toLowerCase() in {science:1, business:1, media:1}))
          throw new UserInputError('allowed topics are [science, business, media].')
      }

      document.ticket = createHash('md5').update(JSON.stringify(document)).digest('hex')
      document.timestamp = parseInt(Date.now() / 1000)
      // persist in db
      await Documents.create(document)
      // emit event lazily
      sendToBroker(document)

      return { ticket: document.ticket }
    }
  }
}
