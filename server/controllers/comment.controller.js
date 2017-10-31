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


     // Here we are fetching our nested comments
     // by pushing everything to a promise
     _.each(comments, (comment)=> {
       commentPromises.push(Comment.fillNestedComments(comment));
     });
     return Promise.all(commentPromises)
   })
   .then((newComments) => {
     // Fetch all comments likes here isntead
     // TODO: use statics isntead .... since not really modifying own object
     let getLikesPromises = [];
     // _.each(newComments, function)
      // Get likes for top level

      // Get likes for children
     });
     return Promise.all(getLikesPromises);
   })
   .then( () => {
     res.json({result: newComments});
   })
   .catch(e => next(e));
 }

  export default {list, create};
