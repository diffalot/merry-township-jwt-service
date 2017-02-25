const townshipAccounts = require('township-accounts')
const townshipReset = require('township-reset-password-token')
const townshipEmail = require('township-email')

const db = require('./db')
const emailTransport = require('./email-transport')

const secret = process.env.AUTH_SECRET

const accounts = townshipAccounts(db, {
  secret: secret
})

const reset = townshipReset(db, {
  secret: secret
})

const email = townshipEmail({
  transport: emailTransport
})

module.exports = {
  accounts,
  reset,
  email
}
