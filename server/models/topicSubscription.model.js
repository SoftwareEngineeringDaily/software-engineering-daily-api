import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

/**
 * Schema
 */
const topicSubscriptionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  topic: {
    type: Schema.Types.ObjectId,
    ref: 'Topic'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(`${config.mongo.collectionPrefix}TopicSubscription`, topicSubscriptionSchema);
