require('dotenv').config()

const test = require('tape')
const request = require('request')
const townshipAccounts = require('township-accounts')
const townshipReset = require('township-reset-password-token')

var db = require('./lib/db')
var secret = process.env.AUTH_SECRET
var accounts = townshipAccounts(db, {
  secret: secret
})
const reset = townshipReset(db, {
  secret: secret
})

const API_URL = `http://localhost:${process.env.PORT}`

require('./')

test('GET /login is 404', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'GET'
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    body = JSON.parse(body)
    t.same(res.statusCode, 404, 'Received 404')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /login fails without login', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'POST',
    json: { password: 'password' }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.email', 'Received email is required')
    t.end()
  })
})

test('POST to /login fails without password', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'POST',
    json: { email: 'test@example.com' }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.password', 'Received password is required')
    t.end()
  })
})

test('POST to /login fails with bad user and password', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'POST',
    json: {
      email: 'bad@example.com',
      password: 'password'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('GET /register is 404', function (t) {
  let options = {
    uri: `${API_URL}/register`,
    method: 'GET'
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    body = JSON.parse(body)
    t.same(res.statusCode, 404, 'Received 404')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /register fails without login', function (t) {
  let options = {
    uri: `${API_URL}/register`,
    method: 'POST',
    json: { password: 'password' }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.email', 'Received email is required')
    t.end()
  })
})

test('POST to /register fails without password', function (t) {
  let options = {
    uri: `${API_URL}/register`,
    method: 'POST',
    json: { email: 'test@example.com' }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.password', 'Received password is required')
    t.end()
  })
})

test('POST to /register succeedes with email and password', function (t) {
  let email = 'user@example.com'
  let options = {
    uri: `${API_URL}/register`,
    method: 'POST',
    json: {
      email: email,
      password: 'password'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(body.key, 'Received key')
    t.ok(body.token, 'Received token')
    accounts.findByEmail(email, function (err, account) {
      if (err) console.log(err)
      t.same(account.access.scopes.length, 1, 'Only default scope set')
      t.ok(account.access.scopes.indexOf('default') > -1, 'Default scope set')
      t.end()
    })
  })
})

test('POST to /register fails with duplicate email and password', function (t) {
  let options = {
    uri: `${API_URL}/register`,
    method: 'POST',
    json: {
      email: 'user@example.com',
      password: 'password'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received message')
    t.end()
  })
})

test('POST to /register succeedes with scopes', function (t) {
  let email = 'user2@example.com'
  let options = {
    uri: `${API_URL}/register`,
    method: 'POST',
    json: {
      email: email,
      password: 'password',
      scopes: ['buyer', 'seller', 'admin']
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(body.key, 'Received key')
    t.ok(body.token, 'Received token')
    accounts.findByEmail(email, function (err, account) {
      if (err) console.log(err)
      let scopes = account.access.scopes
      t.same(scopes.length, 3, 'Includes 3 scopes')
      t.ok(scopes.indexOf('buyer') > -1, 'Contains buyer scope')
      t.ok(scopes.indexOf('seller') > -1, 'Contains seller scope')
      t.ok(scopes.indexOf('default') > -1, 'Contains scope scope')
      t.ok(scopes.indexOf('admin') === -1, 'Does not contain admin scope')
      t.end()
    })
  })
})

test('POST to /register succeedes with duplicate scopes', function (t) {
  let email = 'user3@example.com'
  let options = {
    uri: `${API_URL}/register`,
    method: 'POST',
    json: {
      email: email,
      password: 'password',
      scopes: ['buyer', 'seller', 'buyer', 'admin', 'default']
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(body.key, 'Received key')
    t.ok(body.token, 'Received token')
    accounts.findByEmail(email, function (err, account) {
      if (err) console.log(err)
      let scopes = account.access.scopes
      t.same(scopes.length, 3, 'Includes 3 scopes')
      t.ok(scopes.indexOf('buyer') > -1, 'Contains buyer scope')
      t.ok(scopes.indexOf('seller') > -1, 'Contains seller scope')
      t.ok(scopes.indexOf('default') > -1, 'Contains default scope')
      t.ok(scopes.indexOf('admin') === -1, 'Does not contain admin scope')
      t.end()
    })
  })
})

test('POST to /login succeedes with good email and password', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'POST',
    json: {
      email: 'user@example.com',
      password: 'password'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(body.key, 'Received key')
    t.ok(body.token, 'Received token')
    t.end()
  })
})

test('GET /verify is 404', function (t) {
  let options = {
    uri: `${API_URL}/verify`,
    method: 'GET'
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    body = JSON.parse(body)
    t.same(res.statusCode, 404, 'Received 404')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /verify fails without token', function (t) {
  let options = {
    uri: `${API_URL}/verify`,
    method: 'POST',
    json: {}
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.token', 'Received token is required')
    t.end()
  })
})

test('POST to /verify succeedes with good token', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'POST',
    json: {
      email: 'user@example.com',
      password: 'password'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(body.key, 'Received key')
    t.ok(body.token, 'Received token')
    let verify = {
      uri: `${API_URL}/verify`,
      method: 'POST',
      json: {
        token: body.token
      }
    }
    request(verify, function (errror, response, valid) {
      t.same(response.statusCode, 200, 'Received 200')
      t.ok(valid.valid, 'Key is valid')
      t.end()
    })
  })
})

test('POST to /verify fails with bad token', function (t) {
  let options = {
    uri: `${API_URL}/verify`,
    method: 'POST',
    json: {
      token: 'this token is bad'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(!body.valid, 'Token is not valid')
    t.end()
  })
})

test('GET /logout is 404', function (t) {
  let options = {
    uri: `${API_URL}/verify`,
    method: 'GET'
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    body = JSON.parse(body)
    t.same(res.statusCode, 404, 'Received 404')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /logout succeedes with good email and password', function (t) {
  let options = {
    uri: `${API_URL}/login`,
    method: 'POST',
    json: {
      email: 'user@example.com',
      password: 'password'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.ok(body.key, 'Received key')
    t.ok(body.token, 'Received token')
    let logout = {
      uri: `${API_URL}/logout`,
      method: 'POST',
      json: {
        token: body.token
      }
    }
    request(logout, function (error, response, valid) {
      if (error) console.log(error)
      t.same(response.statusCode, 200, 'Received 200')
      t.ok(valid.logout, 'logged out')
      let verify = {
        uri: `${API_URL}/verify`,
        method: 'POST',
        json: {
          token: body.token
        }
      }
      request(verify, function (errror, response, valid) {
        t.same(response.statusCode, 200, 'Received 200')
        t.ok(!valid.valid, 'Token is invalid')
        t.end()
      })
    })
  })
})

test('POST to /logout fails with bad token', function (t) {
  let options = {
    uri: `${API_URL}/logout`,
    method: 'POST',
    json: {
      token: 'this token is bad'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('GET /send_reset is 404', function (t) {
  let options = {
    uri: `${API_URL}/send_reset`,
    method: 'GET'
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    body = JSON.parse(body)
    t.same(res.statusCode, 404, 'Received 404')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /send_reset fails with bad email', function (t) {
  let options = {
    uri: `${API_URL}/send_reset`,
    method: 'POST',
    json: {
      email: 'bad@example.com'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /send_reset succeedes with good email', function (t) {
  let options = {
    uri: `${API_URL}/send_reset`,
    method: 'POST',
    json: {
      email: 'user@example.com'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 200, 'Received 200')
    t.same(body.email, 'user@example.com', 'Received email')
    t.ok(body.success, 'Received success')
    t.ok(true, 'EMAIL SENDING IS NOT ACTUALLY TESTED!!!')
    t.end()
  })
})

test('GET /reset_password is 404', function (t) {
  let options = {
    uri: `${API_URL}/reset_password`,
    method: 'GET'
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    body = JSON.parse(body)
    t.same(res.statusCode, 404, 'Received 404')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.end()
  })
})

test('POST to /reset_password fails with no key', function (t) {
  let options = {
    uri: `${API_URL}/reset_password`,
    method: 'POST',
    json: {
      token: 'not a real token'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.key', 'Reset must include key')
    t.end()
  })
})

test('POST to /reset_password fails with no token', function (t) {
  let options = {
    uri: `${API_URL}/reset_password`,
    method: 'POST',
    json: {
      key: 'not a real key'
    }
  }
  request(options, function (err, res, body) {
    if (err) console.log(err)
    t.same(res.statusCode, 400, 'Received 400')
    t.ok(body.error, 'Received error')
    t.ok(body.message, 'Received error message')
    t.same(body.data[0].field, 'data.token', 'Reset must include token')
    t.end()
  })
})

test('POST to /reset_password succeedes with good key, token, and newPassword', function (t) {
  accounts.findByEmail('user@example.com', function (err, account) {
    if (err) console.log(err)
    reset.create({accountKey: account.key}, function (err, token) {
      if (err) console.log(err)
      let options = {
        uri: `${API_URL}/reset_password`,
        method: 'POST',
        json: {
          key: account.key,
          token: token,
          newPassword: 'new password'
        }
      }
      request(options, function (err, res, body) {
        if (err) console.log(err)
        t.same(res.statusCode, 200, 'Received 200')
        t.ok(body.token, 'Received token')
        t.end()
      })
    })
  })
})

test('app exits', function (t) {
  t.ok(true, 'app will exit')
  t.end()
  process.exit()
})
