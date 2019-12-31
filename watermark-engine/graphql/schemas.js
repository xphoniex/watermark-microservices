const { gql } = require('apollo-server')

module.exports = gql`
  type Query {
    status(ticket: String!): String!
  }

`
