import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Thread from '../models/thread.model';

export default {
  load: async (req, res, next, id) => {
    Thread.get(id)
      .then((thread) => {
        req.thread = thread; // eslint-disable-line no-param-reassign
        return next();
      })
      .catch(e => next(e));
  },
  list: async (req, res, next) => {
    const {
      limit, createdAt, sort, search
    } = req.query;
    const authUser = req.user;
    Thread.list({
      limit,
      createdAt,
      authUser,
      sort,
      search
    })
      .then(threads => res.json(threads))
      .catch(err => next(err));
  },
  detail: async (req, res, next) => {
    Thread.get(req.params.threadId, req.user)
      .then(thread => res.json(thread))
      .catch(err => next(err));
  },
  create: async (req, res, next) => {
    try {
      const newThread = new Thread(req.body);
      newThread.author = req.user;

      await newThread.save();
      return res.status(httpStatus.CREATED).json(newThread);
    } catch (err) {
      return next(err);
    }
  },
  delete: async (req, res, next) => {
    try {
      const thread = await Thread.findById(req.params.threadId);

      if (!thread) {
        return next(new APIError('Thread not found', httpStatus.NOT_FOUND));
      }

      if (thread.author.toString() !== req.user._id.toString()) {
        return next(new APIError('Not allowed to delete a thread you did not post', httpStatus.UNAUTHORIZED));
      }

      await thread.remove();

      return res.status(httpStatus.OK).json({ message: 'ok' });
    } catch (err) {
      return next(err);
    }
  },
  update: async (req, res, next) => {
    try {
      const thread = await Thread.findById(req.params.threadId);

      if (!thread) {
        return next(new APIError('Thread not found', httpStatus.NOT_FOUND));
      }

      if (thread.author.toString() !== req.user._id.toString()) {
        return next(new APIError('Not allowed to update a thread you did not post', httpStatus.UNAUTHORIZED));
      }

      const updated = Object.assign(thread, req.body);
      await updated.save();

      return res.status(httpStatus.OK).json(thread);
    } catch (err) {
      return next(err);
    }
  }
};
