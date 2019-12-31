const { gql } = require('apollo-server')

module.exports = gql`
  type Book {
    title: String!
    author: String!
    watermark: Watermark
  }

  type Watermark {
    content: String!
    title: String!
    author: String!
    topic: String!
  }
  
  type Query {
    book(ticket: String!): Book!
  }

`
