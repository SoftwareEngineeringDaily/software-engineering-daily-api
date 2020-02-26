import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

/**
 * Schema
 */
const notificationSchema = new mongoose.Schema({
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notification: {
    type: Object
  },
  type: {
    type: String
  },
  entity: {
    type: String
  },
  read: {
    type: Boolean,
    default: false
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(`${config.mongo.collectionPrefix}Notification`, notificationSchema);
