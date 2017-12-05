import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

/**
 * Schema
 */
const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  stripe: {
    customerId: {type: String},
    subscriptionId: {type: String},
    email: {type: String}
  },
  active: {type: Boolean}
  // date expired
  // date created
});

export default mongoose.model('Subscription', SubscriptionSchema);
