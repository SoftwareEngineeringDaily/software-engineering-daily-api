import mongoose, { Schema } from 'mongoose';

const feedItemSchema = new Schema(); // TODO: replace with proper import
const FeedSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  feedItems: [feedItemSchema]
});

export default mongoose.model('Feed', FeedSchema);
