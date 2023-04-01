const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = 4001
app.use(cors())
app.use('/static', express.static(path.join(__dirname, '../dist')))

app.listen(PORT, () =>
  console.log('Running static assets at http://localhost:' + PORT + '/static')
)
