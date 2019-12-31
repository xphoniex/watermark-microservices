const { ApolloServer } = require('apollo-server-express')
const { createTestClient } = require('apollo-server-testing')
const { gql } = require('apollo-server')
const mongoose = require('mongoose')

const Documents = require('../db/models/Documents')
const { grcpReceiveHandler } = require('../handlers/grcpreceive')

const server = new ApolloServer({
  typeDefs: require('../graphql/schemas'),
  resolvers: require('../graphql/resolvers'),
})

const { query } = createTestClient(server)

const LOGS = gql`
  query logs {
    logs {
      ticket
      status
    }
  }
`

const STATUSES = gql`
  query statuses {
    statuses {
      ticket
      status
    }
  }
`

const pendingDoc = { title: 'generic-title', author: 'generic-author', ticket: 'dfbde9cc6', status: 'pending' }
const finishedDoc = { title: 'race-condition', author: 'generic-author', ticket: 'dfbde9cc7', status: 'finished' }

const sleep = (time) => new Promise(resolve => setTimeout(resolve, time))

describe('When receiving statuses updates', () => {

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__,
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
      async (err) => {

      if (err) {
        console.error(err)
        process.exit(1)
      }

      await new Documents(pendingDoc).save()
      await new Documents(finishedDoc).save()
    })
  })

  it ('should update the doc and cache log, normal case', async () => {

    let updated = false
    console.log('for document:', pendingDoc)
    grcpReceiveHandler({ticket: 'dfbde9cc6', status: 'started'})

    while (!updated) {
      await sleep(250)
      const document = await Documents.findOne({ ticket: 'dfbde9cc6' })
      updated = document.status === 'started'
    }

    console.log('updated ✓')

  })

  it ('should resolve a race condition if status event arrived out of order', async () => {

    console.log('for document:', finishedDoc)
    grcpReceiveHandler({ticket: 'dfbde9cc7', status: 'pending'})
    console.log('sleeping for 2.5s')
    await sleep(2500)
    const document = await Documents.findOne({ ticket: 'dfbde9cc7' })
    expect(document.status).toBe('finished')
    console.log('same as before ✓')

  })

  it ('logs should show 2 entries', async () => {

    console.log('log should show 2 entries:')
    const result = await query({query: LOGS})
    console.log(result.data.log)
    expect(result.data.logs.length).toBe(2)
    expect(result.data.logs[0].ticket).toBe('dfbde9cc6')
    expect(result.data.logs[1].ticket).toBe('dfbde9cc7')

  })

  it ('statuses should show one started and one finished', async () => {

    console.log('even though only one has been changed in db:')

    const result = await query({query: STATUSES})
    console.log(result.data.statuses)
    expect(result.data.statuses[0].status).toBe('started')
    expect(result.data.statuses[1].status).toBe('finished')

  })

  afterAll(() => {
    mongoose.disconnect()
    //server.stop()
  })

})
