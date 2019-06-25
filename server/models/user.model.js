import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import bcrypt from 'bcrypt-nodejs';
import APIError from '../helpers/APIError';
import config from '../../config/config';

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    // , required: true // Should be requied since it is also validated
  },
  password: {
    type: String,
    required: true
    // TODO: Should be required.
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  /* TODO
  save StripeCustomer ID?
  */
  name: {
    type: String
    // , required: true // Should be requied but need to update all clients
  },
  avatarUrl: {
    type: String
  },
  bio: {
    type: String
  },
  about: {
    type: String
  },
  website: {
    type: String
  },
  linkedin: {
    type: String
  },
  twitter: {
    type: String
  },
  github: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  email: {
    type: String
  },
  publicEmail: {
    type: String
  },
  facebook: {
    id: {
      type: String
    },
    token: {
      type: String
    },
    email: {
      type: String
    },
    name: {
      type: String
    }
  },
  topics: {
    type: Array
  },
  emailNotiicationSettings: {
    unsubscribedFromThreads: {
      type: Boolean,
      default: false
    },
    unsubscribedFromCommentReplies: {
      type: Boolean,
      default: false
    },
    unsubscribedFromMentions: {
      type: Boolean,
      default: false
    }
  },
  signedupForNewsletter: {
    type: Boolean,
    default: false
  },
  // mobileNumber: {
  //   type: String,
  //   required: true,
  //   match: [/^[1-9][0-9]{9}$/, 'The value of path {PATH} \
  // ({VALUE}) is not a valid mobile number.']
  // },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({
  validPassword: function validPassword(password) {
    return bcrypt.compareSync(password, this.password);
  }
});

/**
 * Statics
 */
UserSchema.statics = {
  /**
   * Get user
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  get(id) {
    return this.findById(id)
      .populate('subscription')
      .exec()
      .then((user) => {
        if (user) {
          return user;
        }
        const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
        return Promise.reject(err);
      });
  },

  generateHash: function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(+skip)
      .limit(+limit)
      .exec();
  },

  isValidHash: function validPassword({ original, hash }) {
    return bcrypt.compareSync(original, hash);
  },
  updatableFields: ['username', 'website', 'bio', 'publicEmail', 'twitter', 'github', 'linkedin', 'about', 'name', 'email']
};

/**
 * @typedef User
 */
export default mongoose.model(`${config.mongo.collectionPrefix}User`, UserSchema);
