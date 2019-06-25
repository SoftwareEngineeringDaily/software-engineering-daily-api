import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

const feedItemSchema = new Schema(); // TODO: replace with proper import
const FeedSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  feedItems: [feedItemSchema]
});

export default mongoose.model(`${config.mongo.collectionPrefix}Feed`, FeedSchema);
