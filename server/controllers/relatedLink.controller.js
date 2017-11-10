import Promise from 'bluebird';
import mongoose from 'mongoose';
import map from 'lodash/map';

import RelatedLink from '../models/relatedLink.model';


/**
 * @swagger
 * tags:
 * - name: relatedLink
 *   description: Related links for episodes. 
 */

/**
 * @swagger
 * /posts/{postId}/relatedLink:
 *   post:
 *     summary: Create relatedLink for episode
 *     description: Create relatedLink for episode
 *     tags: [relatedLink]
 *     security:
 *       - Token: []
 *     parameters:
 *       - $ref: '#/parameters/postId'
 *       - in: body
 *         name: URL
 *         type: string
 *         required: true
 *         description: URL for link
 *     responses:
 *       '201':
 *         description: successful created
 *         schema:
 *              $ref: '#/definitions/RelatedLink'
 *       '401':
 *         $ref: '#/responses/Unauthorized'
 *       '404':
 *         $ref: '#/responses/NotFound'
 */


function create(req, res, next) {
  const { user } = req;
  const { postId } = req.params;
  const { url } = req.body;

  const relatedLink = new RelatedLink();
  relatedLink.url = url;
  relatedLink.post = postId
  relatedLink.author = user._id
  relatedLink.save()
  .then((relatedLink)  => {
    return res.status(201).json(relatedLink);
  })
  .catch( (err) => next(err));
}

export default {create};
