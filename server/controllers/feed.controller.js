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
    // If user is new and doesn't have a feed, use Jeff's feed
    if (!feed) {
      Feed.findOne({user: '597a06d7f0dc67003db0c4c0'})
      .exec()
      .then((jeffsFeed) => {
        if(jeffsFeed) {
          res.json(jeffsFeed.feedItems)
        }
        else{
          res.json([])
        }
      })
      .catch((error) => {
          const err = new APIError('Error fetching Jeffs feed', httpStatus.INTERNAL_SERVER_ERROR, true); //eslint-disable-line
          return next(err);
      })
    }
    else {
      res.json(feed.feedItems);
    }
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
