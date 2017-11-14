import Promise from 'bluebird';
import mongoose, {Schema} from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Vote from './vote.model';
/**
 * @swagger
 * definitions:
 *   RelatedLink:
 *     type: object
 *     properties:
 *       _id:
 *         $ref: '#/definitions/ObjectId'
 *       __v:
 *         $ref: '#/definitions/MongoVersion'
 *       url:
 *         type: string
 *         description: Related URL
 *         example: google.com
 *       title:
 *         type: string
 *         description: Related URL
 *         example: google.com
 *       clicks:
 *         type: number
 *         description: Number of clicks this url has received
 *         example: 10
 *       dateCreated:
 *         type: string
 *         format: date-time
 *         description: Date link was created
 *         example: 2017-10-30T01:05:39.674Z
 *       author:
 *         $ref: '#/definitions/ObjectId'
 *       post:
 *         $ref: '#/definitions/ObjectId'
 */
const RelatedLinkSchema = new Schema({
  id: String,
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  clicks: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  deleted: {
    type: Boolean,
    default: false
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});


/**
 * Statics
 */
RelatedLinkSchema.statics = {};

// Indexes
RelatedLinkSchema.index({ 'url': 'text' });

export default mongoose.model('RelatedLink', RelatedLinkSchema);
