import mongoose, { Schema } from 'mongoose';

/**
 * @swagger
 * definitions:
 *   Job:
 *     type: object
 *     properties:
 *       _id:
 *         $ref: '#/definitions/ObjectId'
 *       __v:
 *         $ref: '#/definitions/MongoVersion'
 *       companyName:
 *         type: string
 *         description: Name of the company posting the job
 *         example: Facebook
 *       applicationEmailAddress:
 *         type: string
 *         format: email
 *         description: Email address that job applications should be sent to
 *         example: mark@facebook.com
 *       location:
 *         type: string
 *         description: Location where the job is based - can be remote for remote working
 *         example: Silicon Valley
 *       title:
 *         type: string
 *         description: The title to be displayed on the job posting
 *         example: Senior Web Developer
 *       description:
 *         type: string
 *         description: The full description of the job, roles, responsibilities etc.
 *       downvote:
 *         type: boolean
 *         description: if authenticated, returns if user downvoted episode
 *       bookmarked:
 *         type: boolean
 *         description: if authenticated, returns if user bookmarked the episode
 *     required:
 *       - _id
 *       - title
 *       - content
 *       - date
 *       - score
 */
const JobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  applicationEmailAddress: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [{
    type: Number
  }],
  employmentType: {
    type: String,
    required: true,
    enum: [
      'Permanent',
      'Contract'
    ]
  },
  remoteWorkingConsidered: Boolean,
  postedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expirationDate: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Job', JobSchema);
