const Documents = require('../db/models/Documents')

module.exports = {
  Query: {
    status: async(parent, { ticket }, _, __) => {
      return (await Documents.findOne({ ticket }, { status: 1 })).status
    }
  }
}
