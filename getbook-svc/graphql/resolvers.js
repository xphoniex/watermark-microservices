const Documents = require('../db/models/Documents')

module.exports = {
  Query: {
    book: async(parent, { ticket }, _, __) => {
      return await Documents.findOne(
        {
          ticket,
          watermark: { $exists: true },
          'watermark.content': 'book' 
        }
      )
    }
  }
}
