const mongoose = require('mongoose')
const Documents = require('../db/models/Documents')
const sender = require('../grpc/sender')

const spy = jest.fn()

jest.spyOn(sender, 'sendUpdate').mockImplementation(update => { spy(update) })

const normalDoc = {
  title: 'pending-book',
  author: 'generic-author',
  content: 'book',
  topic: 'media',
  timestamp: 0,
  ticket: '11415d9ddc',
  status: 'pending'
}
const stuckDoc = Object.assign({}, normalDoc, {ticket: '11415d9ddc1', status: 'started'})

const { documentHandler } = require('../routes/handlers')

describe('Different events that could be sent to engine', () => {

  beforeAll(async () => {
    await mongoose.connect(global.__MONGO_URI__,
      { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true },
      async (err) => {

      if (err) {
        console.error(err)
        process.exit(1)
      }

      await new Documents(normalDoc).save()
      await new Documents(stuckDoc).save()
    })
  })

  it ('should call grpc.sender twice and set watermark for normal case', (done) => {
    let res = ''
    documentHandler({ body: normalDoc }, { end: async (data) => {
      res = data
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith({ticket: '11415d9ddc', status: 'started'})
      expect(spy).toHaveBeenCalledWith({ticket: '11415d9ddc', status: 'finished'})
      expect(res).toBe('OK')
      res = await Documents.findOne({ticket: '11415d9ddc'})
      expect(res.watermark).toBeDefined()
      done()
    }})
  })

  it ('should call grpc.sender once and set watermark for case stuck in started', (done) => {
    let res = ''
    documentHandler({ body: stuckDoc }, { end: async (data) => {
      res = data
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenCalledWith({ticket: '11415d9ddc1', status: 'finished'})
      expect(res).toBe('OK')
      res = await Documents.findOne({ticket: '11415d9ddc1'})
      expect(res.watermark).toBeDefined()
      done()
    }})
  })

  afterAll(() => {
    mongoose.disconnect()
  })

})
