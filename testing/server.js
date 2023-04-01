const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()

const PORT = 4002

app.use(cors())

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/template.html'))
})

app.listen(
  PORT,
  console.log('Running template server at http://localhost:' + PORT)
)
