import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

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
 *       tags:
 *         type: array
 *         description: Array of tag id's related to the type of job being posted.
 *       employmentType:
 *         type: string
 *         description: Enumerated value indicating the type of employment offered
 *         example: Permanent
 *       remoteWorkingConsidered:
 *         type: boolean
 *         description: Whether the employer would consider a |
 *            remote worker for the position advertised.
 *       postedUser:
 *         type: string
 *         description: An object identifier of the user making the job posting
 *       postedDate:
 *         type: date
 *         description: The date the job was posted
 *       expirationDate:
 *         type: date
 *         description: The date the job posting should expire. |
 *            After this date the job should no longer be returned in searches.
 *       isDeleted:
 *         type: boolean
 *         description: Set by the posted user when the job posting is no longer available. |
 *            When true this job will no longer appear in search results.
 *     required:
 *       - _id
 *       - companyName
 *       - applicationEmailAddress
 *       - location
 *       - title
 *       - description
 *       - employmentType
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

export default mongoose.model(`${config.mongo.collectionPrefix}Job`, JobSchema);
