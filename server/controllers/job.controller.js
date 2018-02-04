import httpStatus from 'http-status';
import Job from '../models/job.model';
import APIError from '../helpers/APIError';

export default {
  list(req, res, next) {
    const today = new Date().getDate();

    const query = Job
      .where('isDeleted').equals(false)
      .or([{ expirationDate: { $gt: today } }, { expirationDate: null }]);

    return query
      .then(jobs => res.json(jobs))
      .catch(e => next(e));
  },

  create(req, res, next) {
    const newJob = new Job(req.body);
    newJob.postedUser = req.user;

    return newJob
      .save()
      .then(job => res.status(httpStatus.CREATED).json(job))
      .catch(err => next(err));
  },

  delete(req, res, next) {
    return Job
      .findById(req.params.jobId)
      .then((job) => {
        if (!job) {
          return next(new APIError('Job not found', httpStatus.NOT_FOUND));
        }

        if (job.postedUser.toString() !== req.user._id.toString()) {
          return next(new APIError('Not allowed to delete a job you did not post', httpStatus.UNAUTHORIZED));
        }

        const updatedJob = Object.assign(job, { isDeleted: true });
        return updatedJob
          .save()
          .then(() => res.status(httpStatus.OK).json(updatedJob));
      })
      .catch(err => next(err));
  },

  update(req, res, next) {
    return Job
      .findById(req.params.jobId)
      .then((job) => {
        if (!job) {
          return next(new APIError('Job not found', httpStatus.NOT_FOUND));
        }

        if (job.postedUser.toString() !== req.user._id.toString()) {
          return next(new APIError('Not allowed to update a job you did not post', httpStatus.UNAUTHORIZED));
        }

        if (job.isDeleted) {
          return next(new APIError('Not allowed to update this job as it has been deleted', httpStatus.FORBIDDEN));
        }

        const updated = Object.assign(job, req.body);
        return updated
          .save()
          .then(() => res.status(httpStatus.OK).json(updated));
      })
      .catch(err => next(err));
  },

  get(req, res, next) {
    return Job
      .findById(req.params.jobId)
      .then((job) => {
        if (!job) {
          return next(new APIError('Job not found', httpStatus.NOT_FOUND));
        }

        // If the job posting has been logically deleted then it should only
        // be visible to the user who created it initially
        if (job.isDeleted) {
          if (!req.user) {
            return next(new APIError('Job not found', httpStatus.NOT_FOUND));
          }

          if (job.postedUser.toString() !== req.user._id.toString()) {
            return next(new APIError('Job not found', httpStatus.NOT_FOUND));
          }
        }

        return res.json(job);
      })
      .catch(err => next(err));
  }
};
