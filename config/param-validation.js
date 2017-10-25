import Joi from 'joi';

export default {
  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      username: Joi.string().required(),
      name: Joi.string().required(),
      bio: Joi.string(),
      website: Joi.string(),
      email: Joi.string().email()
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().required(),
      // Should be required once mobile apps get updated:
      // TODO: consider adding versioning to API so we can roll
      // out new features to different clients.
      name: Joi.string(),
      bio: Joi.string(),
      website: Joi.string(),
      email: Joi.string().email()
    }
  }
};
