import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose';
import {RelatedLinkSchema} from './relatedLink.model';


const FeedSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  feedItems: [RelatedLinkSchema]
});


export default mongoose.model('FeedSchema', FeedSchema);
