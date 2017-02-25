const loginSchema = JSON.stringify({
  required: true,
  type: 'object',
  properties: {
    email: {
      required: true,
      type: 'string'
    },
    password: {
      required: true,
      type: 'string'
    },
    scopes: {
      required: false,
      type: 'array'
    }
  }
})

const tokenSchema = JSON.stringify({
  required: true,
  type: 'object',
  properties: {
    token: {
      required: true,
      type: 'string'
    }
  }
})

const emailSchema = JSON.stringify({
  required: true,
  type: 'object',
  properties: {
    email: {
      required: true,
      type: 'string'
    }
  }
})

const resetSchema = JSON.stringify({
  required: true,
  type: 'object',
  properties: {
    key: {
      required: true,
      type: 'string'
    },
    token: {
      required: true,
      type: 'string'
    },
    newPassword: {
      required: true,
      type: 'string'
    }
  }
})

module.exports = {
  loginSchema,
  tokenSchema,
  emailSchema,
  resetSchema
}
