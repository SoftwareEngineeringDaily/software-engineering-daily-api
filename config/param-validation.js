import Joi from 'joi';

export default {
  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      username: Joi.string().required(),
      name: Joi.string().required(),
      bio: Joi.string().allow(''),
      about: Joi.string().allow(''),
      github: Joi.string().allow(''),
      linkedin: Joi.string().allow(''),
      twitter: Joi.string().allow(''),
      website: Joi.string().allow(''),
      isAvatarSet: Joi.boolean().required(),
      email: Joi.string().email().allow(''),
      publicEmail: Joi.string().email().allow('')
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  createSubscription: {
    body: {
      stripeToken: Joi.string().required(),
      planType: Joi.string().required().allow(['yearly', 'monthly'])
    }
  },

  updateEmailNotiicationSettings: {
    body: {
      unsubscribedFromThreads: Joi.boolean().required(),
      unsubscribedFromMentions: Joi.boolean().required(),
      unsubscribedFromCommentReplies: Joi.boolean().required(),
    }
  },

  regainPassword: {
    body: {
      resetUID: Joi.string().required(),
      newPassword: Joi.string().required(),
      secretKey: Joi.string().required()
    }
  },

  requestPasswordReset: {
    body: {
      email: Joi.string().email().required()
    }
  },

  // POST /api/auth/loginWithEmail
  loginWithEmail: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required()
    }
  },

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
      url: Joi.string().required(),
      title: Joi.string().required()
    }
  },

  comment: {
    body: {
      content: Joi.string().required()
    }
  }
};
