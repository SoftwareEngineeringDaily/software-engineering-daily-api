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


/*
* Load comment and append to req.
*/
function load(req, res, next, id) {
 RelatedLink.findById(id)
   .then((relatedLink) => {
     req.relatedLink = relatedLink; // eslint-disable-line no-param-reassign
     return next();
   })
   .catch(error => next(error));
}

function remove(req, res, next) {
  const {relatedLink, user} = req;
  if (relatedLink &&  user) {
    if (relatedLink.author.toString() !== user._id.toString() ) {
      return res.status(401).json({'Error': 'Please login'});
    } else {
      relatedLink.deleted = true;
      return relatedLink.save().then(()=> {
        console.log('success--------------------------');
        // Sucess:
        return res.json({'deleted': true});
      })
      .catch((e)=>{ console.log('-----error?---------'); next(e);});
    }
  } else {
    return res.status(500).json({});
  }
}

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
  const { url, title } = req.body;

  const relatedLink = new RelatedLink();
  relatedLink.url = url;
  relatedLink.title = title;
  relatedLink.post = postId
  relatedLink.author = user._id
  relatedLink.save()
  .then((relatedLink)  => {
    return res.status(201).json(relatedLink);
  })
  .catch( (err) => next(err));
}

function list(req, res, next) {
  const { postId } = req.params;
  RelatedLink.list({post: postId, user: req.user})
  .then((relatedLinks) => {
    res.json(relatedLinks);
  })
  .catch( (err) => next(err));
}

export default {create, list, load, remove};
