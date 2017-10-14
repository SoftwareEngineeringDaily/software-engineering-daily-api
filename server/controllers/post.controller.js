import raccoon from 'raccoon';
import Bluebird from 'bluebird';
import mongoose from 'mongoose';

import Post from '../models/post.model';
import Vote from '../models/vote.model';

/**
 * Load post and append to req.
 */
function load(req, res, next, id) {
  Post.get(id)
    .then((post) => {
      req.post = post; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Get post.
 * @returns {Post}
 */
function get(req, res) {
  return res.json(req.post);
}

/**
 * Get post list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Post[]}
 */
function list(req, res, next) {
  const {
    limit = null,
    createdAtBefore = null,
    createdAfter = null,
    type = null,
    tags = null,
    categories = null,
    search = null
  } = req.query;

  const query = { };
  if (limit) query.limit = limit;
  if (createdAtBefore) query.createdAtBefore = createdAtBefore;
  if (createdAfter) query.createdAfter = createdAfter;
  if (type) query.type = type;
  if (req.user) query.user = req.user;
  if (search) query.search = search;

  if (tags) {
    query.tags = tags.split(',');
    let newTags = []; //eslint-disable-line
    query.tags.forEach((tag) => {
      newTags.push(parseInt(tag, 10));
    });
    query.tags = newTags;
  }

  if (categories) {
    query.categories = categories.split(',');
    let newTags = []; //eslint-disable-line
    query.categories.forEach((tag) => {
      newTags.push(parseInt(tag, 10));
    });
    query.categories = newTags;
  }

  Post.list(query)
    .then(users => res.json(users))
    .catch(e => next(e));
}

// @TODO: maybe this should be in a recommendation controller
function recommendations(req, res, next) {
  const numberOfRecommendations = 10;
  raccoon.recommendFor(req.user._id.toString(), numberOfRecommendations)
  .then((recommendationsFound) => {
    const ids = recommendationsFound.map((rec) => {  //eslint-disable-line
      return mongoose.Types.ObjectId(rec); //eslint-disable-line
    });

    return Post.find({ _id: { $in: ids } });
  })
  .then((posts) => { //eslint-disable-line
    return res.json(posts);
  })
  .catch((e) => {
    next(e);
  });
}


export default { load, get, list, recommendations };
