import httpStatus from 'http-status';
import Job from '../models/job.model';

export default {
  list(req, res, next) {
    return Job
      .find({
        isDeleted: false
      })
      .then(jobs => res.json(jobs))
      .catch(e => next(e));
  },

  create(req, res) {
    const newJob = new Job(req.body);
    newJob.postedUser = req.user;

    newJob.save((err, saved) => {
      if (err) {
        return res.send(err);
      }

      return res.status(httpStatus.CREATED).json(saved);
    });
  },

  delete(req, res, next) {
    Job.findById(req.params.jobId, (err, job) => {
      if (err) {
        return res.send(err);
      }

      if (!job) {
        return res.sendStatus(httpStatus.NOT_FOUND);
      }

      if (job.postedUser.toString() !== req.user._id.toString()) {
        return res.sendStatus(httpStatus.UNAUTHORIZED);
      }

      const updatedJob = Object.assign(job, { isDeleted: true });
      updatedJob.save();

      return res.sendStatus(httpStatus.OK);
    }).catch(err => next(err));
  },

  update(req, res, next) {
    Job.findById(req.params.jobId, (err, job) => {
      if (err) {
        return res.send(err);
      }

      if (!job) {
        return res.sendStatus(httpStatus.NOT_FOUND);
      }

      if (job.postedUser.toString() !== req.user._id.toString()) {
        return res.sendStatus(httpStatus.UNAUTHORIZED);
      }

      if (job.isDeleted) {
        return res.sendStatus(httpStatus.FORBIDDEN);
      }

      const updated = Object.assign(job, req.body);
      updated.save();

      return res.status(httpStatus.OK).json(updated);
    }).catch(err => next(err));
  },

  get(req, res) {
    Job.findById(req.params.jobId, (err, job) => {
      if (err) {
        return res.send(err);
      }

      if (!job) {
        return res.sendStatus(httpStatus.NOT_FOUND);
      }

      // If the job posting has been logically deleted then it should only
      // be visible to the user who created it initially
      if (job.isDeleted) {
        if (!req.user) {
          return res.sendStatus(httpStatus.NOT_FOUND);
        }

        if (job.postedUser.toString() !== req.user._id.toString()) {
          return res.sendStatus(httpStatus.NOT_FOUND);
        }
      }

      return res.json(job);
    });
  }
};
