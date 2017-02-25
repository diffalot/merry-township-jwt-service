let transport

if (process.env.NODE_ENV !== 'production') {
  transport = require('nodemailer-stub-transport')()
} else {
  transport = require('nodemailer-stub-transport')()
}

module.exports = transport
