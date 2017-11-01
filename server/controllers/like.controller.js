import Promise from 'bluebird';
import mongoose from 'mongoose';
import _ from 'lodash';

import Like from '../models/like.model';

function create(req, res, next) {
  const { entityToLike } = req.body;
  const { user } = req;
  const like = new Like();
  like.entityLiked = entityToLike;
  like.user = user._id
  like.save()
  .then((result) => {
    return res.status(201).json({result});
  })
  .catch( (err) => next(err));
};

// Simple middleware that moves
// commentId to the body so the `create` can parse it.
function commentIdToBody(req, res, next) {
  const { commentId } = req.params;
  req.body = _.extend({entityToLike: commentId}, req.body)
  next();
}
export default {create, commentIdToBody};
