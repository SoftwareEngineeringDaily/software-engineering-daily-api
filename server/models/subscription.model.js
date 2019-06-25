import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

/**
 * Schema
 */
const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  planFrequency: { type: String, required: true },
  stripe: {
    customerId: { type: String },
    subscriptionId: { type: String },
    planId: { type: String },
    email: { type: String }
  },
  active: { type: Boolean }, // if the subscription is still in place...
  dateCreated: {
    type: Date,
    default: Date.now
  }
  // TODO: date expired???
});

export default mongoose.model(`${config.mongo.collectionPrefix}Subscription`, SubscriptionSchema);
