const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-testing')
const { gql } = require('apollo-server')
const mongoose = require('mongoose')
const Documents = require('../db/models/Documents')

const server = new ApolloServer({
  typeDefs: require('../graphql/schemas'),
  resolvers: require('../graphql/resolvers'),
})

const { query } = createTestClient(server)

const STATUS = gql`
  query status($ticket: String!) {
    status(ticket: $ticket)
  }
`

const statusOfTicket = (ticket) => {
  return new Promise(async (resolve) => {
    const result = await query({
      mutation: STATUS,
      variables: { ticket },
    })
    console.info('requesting status of ticket', ticket)
    result.errors ? console.log('error:', result.errors[0].message) : null
    resolve(result)
  })
}

describe('When retrieving status of Documents', () => {

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__,
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
      async (err) => {

      if (err) {
        console.error(err)
        process.exit(1)
      }

      const author = 'generic-author'
      // pre-populate with three documents
      await new Documents({ title: 'i', author, ticket: '11415d9ddc' }).save()
      await new Documents({ title: 'ii', author, ticket: 'dfbde9cc6', status: 'started' }).save()
      await new Documents({ title: 'iii', author, ticket: 'ccacf6626', status: 'finished' }).save()
    })
  })

  it ('title i should have status == pending', async () => {
    console.log('first book\'s status should be pending')
    const result = await statusOfTicket('11415d9ddc')
    expect(result.data.status).toBe('pending')
    console.log('status:', result.data.status)
  })

  it ('title ii should have status == started', async () => {
    console.log('second book\'s status should be started')
    const result = await statusOfTicket('dfbde9cc6')
    expect(result.data.status).toBe('started')
    console.log('status:', result.data.status)
  })

  it ('title iii should have status == finished', async () => {
    console.log('third book\'s status should be finished')
    const result = await statusOfTicket('ccacf6626')
    expect(result.data.status).toBe('finished')
    console.log('status:', result.data.status)
  })

  it ('random token should throw', async () => {
    const result = await statusOfTicket('random-ticket-123')
    expect(result.errors).toBeDefined()
    console.log('^ there should be an error')
  })

  afterAll(() => {
    mongoose.disconnect()
    //server.stop()
  })

})
