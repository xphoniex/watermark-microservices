const Documents = require('../db/models/Documents')

module.exports = {
  Query: {
    statuses: async(parent, args, _, __) => {
      return await Documents.find({}, { _id: 0, status: 1, ticket: 1 })
    },
    logs: (parent, args, _, __) => {
      return global.statuses
    },
  }
}
