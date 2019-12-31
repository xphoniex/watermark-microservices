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

const BOOK = gql`
  query book($ticket: String!) {
    book(ticket: $ticket) {
      title
      author
      watermark {
        topic
      }
    }
  }
`

const ticketToName = {
  '11415d9ddc': 'pending-book',
  'dfbde9cc6': 'finished-journal',
  'ccacf6626': 'finished-book',
  'ca0a3d637': 'started-but-watermarked-book'
}

const bookOfTicket = (ticket) => {
  return new Promise(async (resolve) => {
    const result = await query({
      mutation: BOOK,
      variables: { ticket },
    })
    console.info(`requesting book "${ticketToName[ticket]}" ticket=${ticket}`)
    result.errors ? console.log('error:', result.errors[0].message) : null
    resolve(result)
  })
}

describe('When retrieving books', () => {

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__,
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
      async (err) => {

      if (err) {
        console.error(err)
        process.exit(1)
      }

      const author = 'generic-author'
      // pre-populate with four documents
      await new Documents({ title: 'pending-book', author, content: 'book', ticket: '11415d9ddc' }).save()
      await new Documents({ title: 'finished-journal', author, content: 'journal', ticket: 'dfbde9cc6', status: 'finished', watermark: { author, content: 'journal', title: 'finished-journal' } }).save()
      await new Documents({ title: 'finished-book', author, ticket: 'ccacf6626', status: 'finished', watermark: { author, topic: 'business', content: 'book', title: 'finished-book' } }).save()
      await new Documents({ title: 'started-but-watermarked-book', author, ticket: 'ca0a3d637', status: 'started', watermark: { author, topic: 'business', content: 'book', title: 'started-but-watermarked-book' } }).save()
    })
  })

  it ('should not return a book that is not watermarked yet', async () => {
    const result = await bookOfTicket('11415d9ddc')
    expect(result.errors).toBeDefined()
    console.log('^ there should be an error')
  })

  it ('should not return a journal regardless of watermark', async () => {
    const result = await bookOfTicket('dfbde9cc6')
    expect(result.errors).toBeDefined()
    console.log('^ there should be an error')
  })

  it ('should return a book that is watermarked, normal case', async () => {
    const result = await bookOfTicket('ccacf6626')
    expect(result.errors).not.toBeDefined()
    console.log('book:', result.data.book)
  })

  it ('should return a book that is watermarked but status stuck on started', async () => {
    const result = await bookOfTicket('ca0a3d637')
    expect(result.errors).not.toBeDefined()
    console.log('book:', result.data.book)
    console.log('we return this case as well')
  })

  afterAll(() => {
    mongoose.disconnect()
    //server.stop()
  })

})
