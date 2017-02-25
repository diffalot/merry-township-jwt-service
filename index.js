require('dotenv').config()

const merry = require('merry')

const routes = require('./lib/routes')

const options = {}

if (process.env.NODE_ENV === 'development') {
  options.logLevel = 'fatal'
}

const app = merry(options)

app.router(routes)

app.listen(process.env.PORT)
