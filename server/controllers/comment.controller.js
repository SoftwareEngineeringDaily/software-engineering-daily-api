import Promise from 'bluebird';
import map from 'lodash/map';

import Comment from '../models/comment.model';

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
 * /comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     description: Mark a comment as deleted
 *     tags: [comment]
 *     security: []
 *     parameters:
 *       - $ref: '#/parameters/commentId'
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
function remove(req, res, next) {
  const { comment, user } = req;
  if (comment && user) {
    if (comment.author._id.toString() !== user._id.toString()) {
      return res.status(401).json({ Error: 'Please login' });
    }

    comment.deleted = true;
    return comment
      .save()
      .then(() => {
        // Sucess:
        res.json({ deleted: true });
      })
      .catch((e) => {
        next(e);
      });
  }
  return res.status(500).json({});
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
  const entityId = req.entity._id;
  const { parentCommentId } = req.body;
  const { content } = req.body;
  const { user } = req;

  const comment = new Comment();
  comment.content = content;
  comment.root = entityId;
  // If this is a child comment we need to assign it's parent
  if (parentCommentId) {
    comment.parentComment = parentCommentId;
  }
  comment.author = user._id;
  comment
    .save()
    .then(commentSaved =>
      // TODO: result key is not consistent with other responses, consider changing this
      res.status(201).json({ result: commentSaved }))
    .catch(err => next(err));
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
  const entityId = req.entity._id;
  // TODO loop through and replace comments that are deleted with "This comment has been deleted"
  Comment.getTopLevelCommentsForItem(entityId)
    .then((comments) => {
      // Here we are fetching our nested comments, and need everything to finish
      const nestedCommentPromises = map(comments, comment => Comment.fillNestedComments(comment));
      return Promise.all(nestedCommentPromises);
    })
    .then((parentComments) => {
      // If authed then fill in if user has liked:
      if (req.user) {
        // Let's get all our voe info for both children and parent comments:
        return Comment.populateVoteInfo(parentComments, req.user);
      }
      return parentComments;
    })
    .then((parentComments) => {
      res.json({ result: parentComments });
    })
    .catch(e => next(e));
}

export default {
  load,
  list,
  create,
  remove
};
