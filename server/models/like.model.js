import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';

const LikeSchema = new Schema({
  entityLiked: {
    type: Schema.Types.ObjectId,
    required: true
  },
  /*
  entityLikedType: {
    type: String,
    required: true
  },
  */
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

LikeSchema.statics = {
  list({ skip = 0, limit = 50 } = {}, userId) {
    return this.find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
export default mongoose.model('Like', LikeSchema);
