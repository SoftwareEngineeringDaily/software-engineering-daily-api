import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Feed from '../models/Feed.model';

function list(req, res, next) {
  Feed.findOne({user: req.user._id})
  .then(({feedItems}) => {
    res.json(feedItems);
  })
  .catch((error) => {
      const err = new APIError('Error fetching user feed', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
      return next(err);
  });
};

export default {list};
