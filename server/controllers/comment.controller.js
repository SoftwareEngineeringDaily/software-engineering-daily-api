import Promise from 'bluebird';
import mongoose from 'mongoose';
import map from 'lodash/map';

import Comment from '../models/comment.model';

function remove(req, res, next) {
  const {comment, user} = req
  console.log("USER", user)
  if (comment &&  user) {
    if (comment.author.toString() !== user._id.toString() ) {
      return res.status(401).json({'Error': 'Please login'});
    }
    else {
      relatedLink.deleted = true;
      if (!relatedLink.title) {
        // For old links :/
        relatedLink.title = relatedLink.url
      }
      return relatedLink.save().then(()=> {
        // Sucess:
        res.json({'deleted': true});
      })
      .catch((e)=>{next(e);});
    }
  } else {
    return res.status(500).json({});
  }
}

/*
* Load comment and append to req.
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
 * @swagger
 * tags:
 * - name: comment
 *   description: Commenting of Episodes
 */

/**
 * @swagger
 * /posts/{postId}/comment:
 *   post:
 *     summary: Create comment for episode
 *     description: Create comment for episode
 *     tags: [comment]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *       - in: body
 *         name: content
 *         type: string
 *         required: true
 *         description: Comment content
 *     responses:
 *       '201':
 *         description: successful created
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               $ref: '#/definitions/Comment'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
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
    // TODO: result key is not consistent with other responses, consider changing this
    return res.status(201).json({result: commentSaved});
  })
  .catch( (err) => next(err));
}

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     summary: Get comments for episode
 *     description: Get comments for episode
 *     tags: [comment]
 *     security: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *           type: object
 *           properties:
 *             result:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Comment'
 *       '404':
 *         $ref: '#/responses/NotFound'
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
       return Comment.populateVoteInfo(parentComments, req.user);
     } else {
       return parentComments;
     }
   })
   .then( (parentComments) => {
     res.json({result: parentComments});
   })
   .catch(e => next(e));
 }

  export default {load, list, create, remove};
