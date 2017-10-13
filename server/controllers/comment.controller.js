import Bluebird from 'bluebird';
import mongoose from 'mongoose';

import Comment from '../models/comment.model';

/**
 * Get post list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Post[]}
 */
function list(req, res, next) {
  const { postId } = req.body;
  console.log('Comments for postId', postId);
  Comment.getCommentsForItem(postId)
    .then((comments) => {
      res.json({comments});
    })
    .catch(e => next(e));
}

export default {list};
