const db = require('./db/db')
const express = require('express')
const bodyParser = require('body-parser')
const { documentHandler } = require('./routes/handlers')

const app = express()

app.use(bodyParser.json({ limit: '1mb' }))

app.post('/', documentHandler)

db.connection.once('open', () => {
  const PORT = process.env.PORT || 8080
  console.log(`connection to db established.`)
  app.listen(PORT, () => console.log(`serving requests on port ${PORT}`))
})
