const db = require('./db/db')
const express = require('express')
const grpcReceiver = require('./grpc/receiver')
const { ApolloServer } = require('apollo-server-express')
const { grcpReceiveHandler } = require('./handlers/grcpreceive')

const app = express()

const server = new ApolloServer({
  typeDefs: require('./graphql/schemas'),
  resolvers: require('./graphql/resolvers'),
  cors: true,
  playground: process.env.NODE_ENV !== 'production' ? true : false,
  introspection: true,
  tracing: true,
  path: '/',
})
server.applyMiddleware({ app, path: '/', cors: true })

grpcReceiver.onReceive = grcpReceiveHandler

db.connection.once('open', () => {
  const PORT = process.env.PORT || 8080
  console.log(`connection to db established.`)
  app.listen(PORT, () => console.log(`serving requests on port ${PORT}`))
})
