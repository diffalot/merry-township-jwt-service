let db

if (process.env.NODE_ENV !== 'production') {
  db = require('memdb')()
} else {
  db = require('levelup')(process.env.MONGO_URI, { db: require('mongodown') })
}

module.exports = db
