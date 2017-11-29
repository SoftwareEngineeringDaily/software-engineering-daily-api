import Promise from 'bluebird';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import APIError from '../helpers/APIError';
import Feed from '../models/feed.model';
import RelatedLink from '../models/relatedLink.model'

function list(req, res, next) {

  // If user is logged out, use Jeff's feed TODO cleaner solution
  let userId = req.user ? req.user._id : '597a06d7f0dc67003db0c4c0'

  Feed.findOne({user: userId})
  .exec()

  .then((feed) => {
    if (!feed) { return res.json([]);}
    res.json(feed.feedItems);
  })
  .catch((error) => {
      const err = new APIError('Error fetching user feed', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
      return next(err);
  });
};

function listProfileFeed(req, res, next) {
    const {userId} = req.params;
    RelatedLink.listProfileFeed({userId})
    .then((relatedLinks) => {
      if(!relatedLinks) { return res.json([]);}
      res.json(relatedLinks);
    })
    .catch((error) => {
      const err = new APIError('Error fetching profile feed', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
      return next(err);
    });
};

export default {list, listProfileFeed};
