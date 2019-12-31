const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-testing')
const { gql } = require('apollo-server')
const mongoose = require('mongoose')
const poster = require('../utils/poster')

const spy = jest.fn()

jest.spyOn(poster, "sendToBroker").mockImplementation(doc => {
  doc.timestamp = 1
  spy(doc)
})

const server = new ApolloServer({
  typeDefs: require('../graphql/schemas'),
  resolvers: require('../graphql/resolvers'),
})

const { mutate } = createTestClient(server)

const WATERMARK = gql`
  mutation watermark($document: DocumentInput!) {
    watermark(document: $document) {
      ticket
    }
  }
`

const sendInvalidWatermarkMutate = (document) => {
  return new Promise(async (resolve) => {
    const result = await mutate({
      mutation: WATERMARK,
      variables: { document },
    })
    console.info('sending...\n', document)
    result.errors ? console.log('error:', result.errors[0].message) : null
    expect(result.errors).toBeDefined()
    resolve()
  })
}

const sendValidWatermarkMutate = (document) => {
  return new Promise(async (resolve) => {
    const result = await mutate({
      mutation: WATERMARK,
      variables: { document },
    })
    console.info('sending...\n', document)
    result.errors ? console.log('error:', result.errors[0].message) : null
    expect(result.errors).not.toBeDefined()
    resolve(result)
  })
}

describe('Invalid Documents should be rejected', () => {

  it ('throws if document has extra fields', async () => {
    const document = { author: 'mr. writer', title: 'good book', content: 'book', extra: true }
    await sendInvalidWatermarkMutate(document)
  })

  it ('throws if document fields are not string', async () => {
    const document = { author: 7, title: 'titleless', content: 'book' }
    await sendInvalidWatermarkMutate(document)
  })

  it ('throws if it\'s neither a book nor a journal', async () => {
    const document = { author: 'openai', title: 'good paper', content: 'paper' }
    await sendInvalidWatermarkMutate(document)
  })

  it ('throws if the book has no topic', async () => {
    const document = { author: 'mr. writer', title: 'good book', content: 'book' }
    await sendInvalidWatermarkMutate(document)
  })

  it ('throws if book\'s topic is not in { science, business, media }', async () => {
    const document = { author: 'mr. writer', title: 'good book', content: 'book', topic: 'lifestyle' }
    await sendInvalidWatermarkMutate(document)
  })

  it ('throws if the document has a topic but is not a book', async () => {
    const document = { author: 'mr. writer', title: 'good book', content: 'journal', topic: 'lifestyle' }
    await sendInvalidWatermarkMutate(document)
  })

})

describe('Valid Documents should work just fine', () => {

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__,
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
      (err) => {

      if (err) {
        console.error(err)
        process.exit(1)
      }
    })
  })

  it ('should return a ticket equal to its md5 hash', async () => {
    const document = { author: 'mr. writer', title: 'good book', content: 'journal' }

    const result = await sendValidWatermarkMutate(document)

    document.timestamp = 1
    document.ticket = '1334c03c929ec5c5347059aeef24cc58'
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(document)

    expect(result.data).toBeDefined()
    expect(result.data.watermark.ticket).toBe('1334c03c929ec5c5347059aeef24cc58')

    console.log('received ticket:', result.data.watermark.ticket, '✓')
  })

  it ('should not be able to add the same document again', async () => {
    const document = { author: 'mr. writer', title: 'good book', content: 'journal' }
    const result = await sendInvalidWatermarkMutate(document)
    console.log('^ there should be an error as we tried adding same doc')
  })

  afterAll(() => {
    mongoose.disconnect()
    //server.stop()
  })

})
