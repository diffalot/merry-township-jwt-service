const merry = require('merry')

const log = merry().log

const { accounts, reset, email } = require('./accounts')
const { loginSchema, tokenSchema, emailSchema, resetSchema } = require('./schemas')

const notFound = merry.notFound

let cors = merry.cors({
  'Access-Control-Allow-Origin': process.env.ALLOWED_CORS || '*'
})

module.exports = [
  [ '/register', cors({
    post: merry.middleware([merry.middleware.schema(loginSchema), register])
  })],
  [ '/login', cors({
    post: merry.middleware([merry.middleware.schema(loginSchema), login])
  })],
  [ '/logout', cors({
    post: merry.middleware([merry.middleware.schema(tokenSchema), logout])
  })],
  [ '/verify', cors({
    post: merry.middleware([merry.middleware.schema(tokenSchema), verify])
  })],
  [ '/send_reset', cors({
    post: merry.middleware([merry.middleware.schema(emailSchema), sendReset])
  })],
  [ '/reset_password', cors({
    post: merry.middleware([merry.middleware.schema(resetSchema), resetPassword])
  })],
  [ '/404', notFound() ]
]

let defaultScopes = []
let allowedScopes = []
if (process.env.DEFAULT_SCOPES) defaultScopes = process.env.DEFAULT_SCOPES.split(',')
if (process.env.ALLOWED_SCOPES) allowedScopes = process.env.ALLOWED_SCOPES.split(',')

function register (req, res, ctx, done) {
  function pruneToAllowedScopes (array) {
    let scopes = [].concat(defaultScopes)
    array.forEach(function (scope) {
      if (allowedScopes.indexOf(scope) > -1) {
        scopes.push(scope)
      }
    })
    return [...new Set(scopes)]
  }
  if (!ctx.body.scopes) ctx.body.scopes = []
  ctx.body.scopes = pruneToAllowedScopes(ctx.body.scopes)
  accounts.register(ctx.body, function (err, account) {
    if (err) {
      done(merry.error({
        statusCode: 400,
        message: err
      }))
    } else {
      done(null, account)
    }
  })
}

function login (req, res, ctx, done) {
  accounts.login(ctx.body, function (err, auth) {
    if (err) {
      done(merry.error({
        statusCode: 400,
        message: err
      }))
    } else {
      done(null, auth)
    }
  })
}

function logout (req, res, ctx, done) {
  accounts.logout(ctx.body.token, function (err) {
    if (err) {
      done(merry.error({
        statusCode: 400,
        message: err
      }))
    } else {
      done(null, {logout: true})
    }
  })
}

function verify (req, res, ctx, done) {
  accounts.verifyToken(ctx.body.token, function (err, account) {
    if (err) {
      log.error(err)
      done(null, {valid: false})
    } else {
      if (account) {
        done(null, {valid: true})
      } else {
        done(null, {valid: false})
      }
    }
  })
}

function sendReset (req, res, ctx, done) {
  accounts.findByEmail(ctx.body.email, function (err, account) {
    if (err) {
      done(merry.error({
        statusCode: 400,
        message: err
      }))
    } else {
      reset.create({accountKey: account.key}, function (err, token) {
        if (err) {
          done(merry.error({
            statusCode: 400,
            message: err
          }))
        } else {
          email.confirm({
            to: account.auth.basic.email,
            from: process.env.EMAIL_FROM,
            url: `${process.env.EMAIL_URL_BASE}/${account.key}/${token}`
          }, function (err, info) {
            if (err) {
              log.error(err)
            } else {
              log.info({
                envelope: info.envelope,
                messageId: info.messageId
              })
            }
          })
          done(null, {
            email: account.auth.basic.email,
            success: true
          })
        }
      })
    }
  })
}

function resetPassword (req, res, ctx, done) {
  reset.confirm({
    accountKey: ctx.body.key,
    token: ctx.body.token
  }, function (err) {
    if (err) {
      done(err)
    } else {
      accounts.auth.get(ctx.body.key, function (err, account) {
        if (err) {
          done(err)
        } else {
          account.basic.password = ctx.body.newPassword
          accounts.auth.update(account, function (err, unused) {
            if (err) {
              done(err)
            } else {
              accounts.login({
                email: account.basic.email,
                password: ctx.body.newPassword
              }, function (err, newLogin) {
                if (err) {
                  done(err)
                } else {
                  done(null, newLogin)
                }
              })
            }
          })
        }
      })
    }
  })
}
