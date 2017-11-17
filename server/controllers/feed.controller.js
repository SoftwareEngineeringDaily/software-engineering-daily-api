import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Feed from '../models/feed.model';

function list(req, res, next) {
  Feed.findOne({user: req.user._id})
  .exec()

  .then((feed) => {
    if (!feed) { return res.json([])}
    res.json(feed.feedItems);
  })
  .catch((error) => {
      const err = new APIError('Error fetching user feed', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
      return next(err);
  });
};

export default {list};
