import Promise from 'bluebird';
import map from 'lodash/map';
import differenceBy from 'lodash/differenceBy';
import moment from 'moment';

import Comment from '../models/comment.model';
import User from '../models/user.model';
import ForumThread from '../models/forumThread.model';
import ForumNotifications from '../helpers/forumNotifications.helper';
import { subscribePostFromEntity, notifySubscribersFromEntity } from '../controllers/postSubscription.controller';
import { saveAndNotifyUser } from '../controllers/notification.controller';
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
 *     security:
 *       - Token: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *            type: String
 *         required: true
 *         description: Id of the comment to be deleted
 *     responses:
 *       '200':
 *         description: successful operation
 *         schema:
 *            type: object
 *            properties:
 *              deleted:
 *                type: string
 *                enum: 'true'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
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
    comment.dateDeleted = moment().format('LLL');
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

async function idsToUsers(ids) {
  const users = [];
  // TODO: dont block on each mention:
  // https://eslint.org/docs/rules/no-await-in-loop
  /* eslint-disable no-await-in-loop */
  for (let ii = 0; ii < ids.length; ii += 1) {
    try {
      const id = ids[ii];
      const user = await User.get(id);
      users.push(user);
    } catch (e) {
      console.log('e.idsToUsers', e);
    }
  }
  /* eslint-disable no-await-in-loop */
  return users;
}

function extractedNewMentions(comment, updatedMentions) {
  const oldMentions = comment.mentions;
  if (!oldMentions) return updatedMentions;
  function getUserId(user) {
    return user._id.toString();
  }
  const newlyAddedMentions = differenceBy(
    updatedMentions,
    oldMentions,
    getUserId
  );
  return newlyAddedMentions;
}

async function update(req, res, next) {
  const { comment, user } = req;
  const { content, mentions, highlight } = req.body;

  if (comment && user) {
    if (comment.author._id.toString() !== user._id.toString()) {
      return res.status(401).json({ Error: 'Please login' });
    }

    if (highlight) {
      comment.highlight = highlight;
    }

    if (mentions) {
      try {
        const updatedMentions = await idsToUsers(mentions);
        const usersWeShouldEmail = extractedNewMentions(comment, updatedMentions);
        comment.mentions = updatedMentions;
        ForumNotifications.sendMentionsNotificationEmail({
          content,
          threadId: comment.rootEntity,
          userWhoReplied: user,
          usersMentioned: usersWeShouldEmail
        });
      } catch (e) {
        console.log('e', e);
      }
    } else {
      comment.mentions = [];
    }

    comment.content = content;
    comment.dateLastEdited = Date();

    return comment
      .save()
      .then((editedComment) => {
        // Sucess:
        res.json(editedComment);
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

async function subscribeAndNotifyCommenter(entityId, user, ignoreNotify) {
  const post = await subscribePostFromEntity(entityId, user);

  const payload = {
    notification: {
      title: `New comment from @${user.name}`,
      body: post.title.rendered,
      data: {
        user: user._id,
        slug: post.slug,
        thread: post.thread
      }
    },
    type: 'comment',
    entity: post._id
  };

  // notify all subscribers
  await notifySubscribersFromEntity(entityId, user, payload, ignoreNotify);
}

async function subscribeAndNotifyMentioned(entityId, mentioned, user) {
  const post = await subscribePostFromEntity(entityId, mentioned);

  const payload = {
    notification: {
      title: `You were mentioned by @${user.name}`,
      body: post.title.rendered,
      data: {
        user: user._id,
        mentioned: mentioned._id,
        slug: post.slug,
        thread: post.thread
      }
    },
    type: 'mention',
    entity: post._id
  };

  // just notify the mentioned user
  saveAndNotifyUser(payload, mentioned._id);
}

async function create(req, res, next) {
  const { entityId } = req.params;
  const { parentCommentId, mentions } = req.body;
  const { content, entityType, highlight } = req.body;
  const { user } = req;

  const comment = new Comment();
  comment.content = content;
  let usersMentioned = [];
  if (mentions) {
    usersMentioned = await idsToUsers(mentions);
    comment.mentions = usersMentioned;
    usersMentioned.forEach((mentioned) => {
      subscribeAndNotifyMentioned(entityId, mentioned, user);
    });
  }

  if (highlight) {
    comment.highlight = highlight;
  }

  comment.rootEntity = entityId;
  // If this is a child comment we need to assign it's parent
  if (parentCommentId) {
    comment.parentComment = parentCommentId;
  }
  comment.author = user._id;

  comment
    .save()
    .then(async (commentSaved) => {
      // don't wait
      subscribeAndNotifyCommenter(entityId, user, mentions);

      // TODO: result key is not consistent with other responses, consider changing this
      if (entityType && entityType.toLowerCase() === 'forumthread') {
        // TODO: move these so we also email for posts:
        // get entity outside of this function and then pass down:
        if (parentCommentId) {
          // TODO: don't email if you are the author and replying to own stuff:
          ForumNotifications.sendReplyNotificationEmail({
            content,
            threadId: entityId,
            userWhoReplied: user
          });
        }

        if (mentions) {
          ForumNotifications.sendMentionsNotificationEmail({
            parentCommentId,
            content,
            threadId: entityId,
            userWhoReplied: user,
            usersMentioned
          });
        }

        ForumNotifications.sendForumNotificationEmail({
          threadId: entityId,
          content,
          userWhoReplied: user
        });
        return ForumThread.increaseCommentCount(entityId).then(() =>
          res.status(201).json({ result: commentSaved }));
      }

      return res.status(201).json({ result: commentSaved });
    })
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
  const { entityId } = req.params;
  // TODO loop through and replace comments that are deleted with "This comment has been deleted"
  Comment.getTopLevelCommentsForItem(entityId)
    .then((comments) => {
      // Here we are fetching our nested comments, and need everything to finish
      const nestedCommentPromises = map(comments, comment => Comment.fillNestedComments(comment));
      return Promise.all(nestedCommentPromises);
    })
    .then((comments) => {
      const updatedComments = Comment.upadteDeletedCommentContent(comments);
      return updatedComments;
    })
    .then((parentComments) => {
      // If authed then fill in if user has liked:
      if (req.user) {
        // Let's get all our vote info for both children and parent comments:
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
  remove,
  update
};
