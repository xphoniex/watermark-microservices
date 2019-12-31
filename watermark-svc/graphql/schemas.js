const { gql } = require('apollo-server')

module.exports = gql`
  type Document {
    title: String!
    author: String!
    content: String
    topic: String
    watermark: Watermark
    ticket: String
    status: String
  }

  input DocumentInput {
    title: String!
    author: String!
    content: String!
    topic: String
    ticket: String
  }

  type Watermark {
    content: String!
    title: String!
    author: String!
    topic: String
  }

  type Ticket {
    ticket: String!
  }

  type Status {
    ticket: String!
    status: String!
  }

  type Query {
    document(ticket: String!): Document!
    status(ticket: String!): String!
    statuses: [Status]!
    dbstatuses: [Status]!
  }

  type Mutation {
    watermark(document: DocumentInput!): Ticket!
  }
`
