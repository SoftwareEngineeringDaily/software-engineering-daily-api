import Bluebird from 'bluebird';
import mongoose from 'mongoose';
import _ from 'lodash';

import Comment from '../models/comment.model';

/**
 * Returns jwt token if valid username and password is provided
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */

function create(req, res, next) {
  const { postId } = req.params;
  const { content } = req.body;
  const { user } = req;

  const comment = new Comment();
  comment.content = content
  comment.post = postId
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
     let commentPromises = [];
     // Here we are fetching our nested comments, and need everything to finish
     _.each(comments, (comment)=> {
       commentPromises.push(Comment.fillNestedComments(comment));
     });
     return Promise.all(commentPromises);
   })
   .then( (parentComments) => {
     res.json({result: parentComments});
   })
   .catch(e => next(e));
 }

  export default {list, create};
