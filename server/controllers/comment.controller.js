import Promise from 'bluebird';
import mongoose from 'mongoose';
import map from 'lodash/map';

import Comment from '../models/comment.model';

/**
 * Load post and append to req.
 */
function load(req, res, next, id) {
  Comment.get(id)
    .then((comment) => {
      req.comment = comment; // eslint-disable-line no-param-reassign
      return next();
    })
    .catch(e => next(e));
}

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */

function create(req, res, next) {
  const { postId } = req.params;
  const { parentCommentId } = req.body;
  const { content } = req.body;
  const { user } = req;

  const comment = new Comment();
  comment.content = content
  comment.post = postId
  // If this is a child comment we need to assign it's parent
  if (parentCommentId) {
    comment.parentComment = parentCommentId
  }
  comment.author = user._id
  comment.save()
  .then((commentSaved)  => {
    return res.status(201).json({result: commentSaved});
  })
  .catch( (err) => next(err));
}

/**
 * Get post list.
 * @property {string} req.body.postId - Id of post to fetch
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {[Comment]}
 */
 function list(req, res, next) {
   const { postId } = req.params;

   Comment.getTopLevelCommentsForItem(postId)
   .then((comments) => {
     // Here we are fetching our nested comments, and need everything to finish
     let nestedCommentPromises = map(comments, (comment) => {
       return Comment.fillNestedComments(comment);
     });
     return Promise.all(nestedCommentPromises);
   })
   .then((parentComments) => {
     // If authed then fill in if user has liked:
     if (req.user) {
       // Let's get all our voe info for both children and parent comments:
       return Comment.populateVoteInfo(parentComments);
     } else {
       return parentComments;
     }
   })
   .then( (parentComments) => {
     res.json({result: parentComments});
   })
   .catch(e => next(e));
 }

  export default {load, list, create};
