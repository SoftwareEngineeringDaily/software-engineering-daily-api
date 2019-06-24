import httpStatus from 'http-status';
import { map } from 'lodash';
import Job from '../models/job.model';
import APIError from '../helpers/APIError';
import sgMail from '../helpers/mail';
import transform from '../helpers/job.helper';
import config from '../../config/config';

require('babel-polyfill');

export default {

  list: async (req, res, next) => {
    try {
      const {
        title,
        location,
        companyName,
        tags
      } = req.query;

      const today = new Date().getDate();

      const query = Job
        .where('isDeleted').equals(false)
        .or([{ expirationDate: { $gt: today } }, { expirationDate: null }]);

      if (title) {
        query.where('title').regex(new RegExp(title, 'i'));
      }

      if (companyName) {
        query.where('companyName').regex(new RegExp(companyName, 'i'));
      }

      if (location) {
        query.where('location').regex(new RegExp(location, 'i'));
      }

      if (tags) {
        const tagsAsNumbers = tags.split(',').map(tag => parseInt(tag, 10));
        query.where({ tags: { $in: tagsAsNumbers } });
      }

      const jobs = await query.sort('-postedDate').exec();
      const transformedJobs = map(jobs, job => transform(job, false));

      return res.json(transformedJobs);
    } catch (err) {
      return next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const newJob = new Job(req.body);
      newJob.postedUser = req.user;

      await newJob.save();
      return res.status(httpStatus.CREATED).json(transform(newJob, true));
    } catch (err) {
      return next(err);
    }
  },

  delete: async (req, res, next) => {
    try {
      const job = await Job
        .findById(req.params.jobId);

      if (!job) {
        return next(new APIError('Job not found', httpStatus.NOT_FOUND));
      }

      if (job.postedUser.toString() !== req.user._id.toString()) {
        return next(new APIError('Not allowed to delete a job you did not post', httpStatus.UNAUTHORIZED));
      }

      const updatedJob = Object.assign(job, { isDeleted: true });
      await updatedJob.save();

      return res.status(httpStatus.OK).json(transform(updatedJob, true));
    } catch (err) {
      return next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const job = await Job
        .findById(req.params.jobId);

      if (!job) {
        return next(new APIError('Job not found', httpStatus.NOT_FOUND));
      }

      if (job.postedUser.toString() !== req.user._id.toString()) {
        return next(new APIError('Not allowed to update a job you did not post', httpStatus.UNAUTHORIZED));
      }

      const today = new Date().getDate();

      if (job.isDeleted || (job.expirationDate && job.expirationDate < today)) {
        return next(new APIError('Not allowed to update this job as it has been deleted', httpStatus.FORBIDDEN));
      }

      const updated = Object.assign(job, req.body);
      await updated.save();

      return res.status(httpStatus.OK).json(transform(updated, true));
    } catch (err) {
      return next(err);
    }
  },

  /**
  * @swagger
  *  /jobs/{jobId}:
  *   get:
  *     summary: Get job by ID
  *     description: Get job by ID
  *     tags: [job]
  *     security: []
  *     parameters:
  *       - $ref: '#/parameters/jobId'
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           $ref: '#/definitions/Job'
  *       '404':
  *         $ref: '#/responses/NotFound'
  */
  get: async (req, res, next) => {
    try {
      const job = await Job
        .findById(req.params.jobId);

      if (!job) {
        return next(new APIError('Job not found', httpStatus.NOT_FOUND));
      }

      // If the job posting has been logically deleted or expired then it should only
      // be visible to the user who created it initially
      const today = new Date().getDate();
      const isJobAuthor = req.user && (job.postedUser.toString() === req.user._id.toString());

      if (job.isDeleted || (job.expirationDate && job.expirationDate < today)) {
        if (!req.user) {
          return next(new APIError('Job not found', httpStatus.NOT_FOUND));
        }

        if (!isJobAuthor) {
          return next(new APIError('Job not found', httpStatus.NOT_FOUND));
        }
      }

      return res.json(transform(job, isJobAuthor));
    } catch (err) {
      return next(err);
    }
  },

  /**
  * @swagger
  *  /jobs/{jobId}/apply:
  *   get:
  *     summary: Applies for a job
  *     description: Submit a job application to the company who posted the job.
  *       Should be accompanied by a covering note and a resume.
  *     tags: [job]
  *     security:
  *       Token: []
  *     parameters:
  *       - $ref: '#/parameters/jobId'
  *     requestBody:
  *       description: A JSON object containing the application details
  *       content:
  *         coveringLetter: A short note from the applicant to the employer.
  *         resume: File containing the applicant's resume to be forwarded to the employer.
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           $ref: '#/definitions/Job'
  *       '400':
  *         description: validation error when required parameters are missing
  *         $ref: '#/responses/BadRequest'
  *       '404':
  *         description: The job being applied for does not exist, has been deleted or has expired
  *         $ref: '#/responses/NotFound'
  */
  apply: async (req, res, next) => {
    try {
      const job = await Job
        .findById(req.params.jobId);

      if (!job) {
        return next(new APIError('Job not found', httpStatus.NOT_FOUND));
      }

      if (job.postedUser.toString() === req.user._id.toString()) {
        return next(new APIError('Unable to apply for a job you posted', httpStatus.FORBIDDEN));
      }
      const today = new Date().getDate();

      if (job.isDeleted || (job.expirationDate && job.expirationDate < today)) {
        return next(new APIError('Job not found', httpStatus.NOT_FOUND));
      }

      if (!req.file) {
        return next(new APIError('Resume is required', httpStatus.BAD_REQUEST));
      }

      if (!req.body.coveringLetter) {
        return next(new APIError('Covering letter is required', httpStatus.BAD_REQUEST));
      }

      const msg = {
        to: job.applicationEmailAddress,
        from: config.email.fromAddress,
        subject: `Job Application : ${job.title}`,
        text: req.body.coveringLetter,
        attachments: [
          {
            content: req.file.buffer.toString('base64'),
            filename: req.file.originalname,
            type: req.file.mimetype,
            disposition: 'attachment'
          }
        ]
      };

      await sgMail.send(msg);
      return res.sendStatus(httpStatus.OK);
    } catch (err) {
      return next(err);
    }
  }
};
