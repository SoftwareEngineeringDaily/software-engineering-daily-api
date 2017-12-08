import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

const ResetPasswordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hash: { type: String, required: true},
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

ResetPasswordSchema.statics = {
  getTokenAndHash() {
    return {
      hash: 'hash', // this is what is stored in the DB
      userKey: 'userKey' // This is what we send to the user
    };
  },

  decodeToken(userKey) {
    return 'hash'; // this is what we look for in the db
  }
};


export default mongoose.model('ResetPassword', ResetPasswordSchema);
