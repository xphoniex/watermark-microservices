const { gql } = require('apollo-server')

module.exports = gql`

  type Status {
    ticket: String!
    status: String!
    timestamp: Int
  }

  type Query {
    logs: [Status]!
    statuses: [Status]!
  }

`
