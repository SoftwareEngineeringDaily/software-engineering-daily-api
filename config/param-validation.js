import Joi from 'joi';

export default {
  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      username: Joi.string().required(),
      name: Joi.string().required(),
      bio: Joi.string().allow(''),
      website: Joi.string().allow(''),
      email: Joi.string().email().allow('')
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },
    // POST /api/auth/login
  login: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().required()
    }
  },

  // POST /api/auth/register
  register: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().required(),
      // Should be required once mobile apps get updated:
      name: Joi.string(),
      bio: Joi.string().allow(''),
      website: Joi.string().allow(''),
      email: Joi.string().email().allow('')
    }
  },

  // POST
  relatedLinkCreate: {
    body: {
      url: Joi.string().required()
    }
  },

  comment: {
    body: {
      content: Joi.string().required()
    }
  }

};
