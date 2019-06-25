import mongoose, { Schema } from 'mongoose';
import Vote from './vote.model';
import config from '../../config/config';
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
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  image: { type: String },
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
RelatedLinkSchema.statics = {
  list({ post, user }) {
    const query = {};
    query.post = post;
    query.deleted = false;

    return this.find(query)
      .sort({ score: -1 })
      .lean()
      .then((links) => {
        if (!user) {
          return { links };
        }

        const linkIds = links.map(link => link._id);
        return Vote.find({ userId: user._id, entityId: { $in: linkIds } }).then(votes => ({
          votes,
          links
        }));
      })
      .then(({ links, votes = [] }) => {
        const voteMap = {};
        votes.forEach((vote) => {
          const voteKey = vote.entityId;
          voteMap[voteKey] = vote;
        });
        // Update links with vote info:
        // eslint-disable-next-line
        for (const index in links) {
          const link = links[index];
          links[index] = Vote.updateEntity(link, voteMap[link._id]); // eslint-disable-line
        }

        return links;
      });
  },
  listProfileFeed({ userId }) {
    return this.find({ author: userId }).lean();
  }
};

// Indexes
RelatedLinkSchema.index({ url: 'text' });

exports.RelatedLinkSchema = RelatedLinkSchema;
export default mongoose.model(`${config.mongo.collectionPrefix}RelatedLink`, RelatedLinkSchema);
