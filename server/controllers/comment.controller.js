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

}

// @TODO: maybe this should be in a recommendation controller
function recommendations(req, res, next) {

}

export default {list};
