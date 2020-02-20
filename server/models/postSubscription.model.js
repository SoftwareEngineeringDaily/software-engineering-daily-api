import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

/**
 * Schema
 */
const postSubscriptionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(`${config.mongo.collectionPrefix}PostSubscription`, postSubscriptionSchema);
