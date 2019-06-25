import mongoose from 'mongoose';
import config from '../../config/config';

const PasswordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hash: { type: String, required: true },
  email: {
    type: String,
    required: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  deleted: {
    type: Boolean,
    default: false
  }
});

PasswordResetSchema.statics = {
  getTokenAndHash() {
    return {
      hash: 'hash', // this is what is stored in the DB
      userKey: 'userKey' // This is what we send to the user
    };
  },

  decodeToken() {
    return 'hash'; // this is what we look for in the db
  }
};

export default mongoose.model(`${config.mongo.collectionPrefix}PasswordReset`, PasswordResetSchema);
