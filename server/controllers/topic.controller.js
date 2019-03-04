import Topic from '../models/topic.model';
import Post from '../models/post.model';

const { ObjectId } = require('mongodb');

/**
 * @swagger
 * tags:
 * - name: topic
 *   description: Topics info and lists
 */

/**
 * @swagger
 * parameters:
 *   topicId:
 *     name: topicId
 *     in: path
 *     description: Mongo ObjectId of topic
 *     required: true
 *     type: string
 */

function create(req, res, next) {
  const topic = new Topic();
  topic.name = req.body.name;

  try {
    if (req.body.post_id) {
      Post.findByIdAndUpdate(req.body.post_id, { $push: { topics: topic._id } }, async (err) => {
        if (err) {
          throw err;
        }
      });
    }
  } catch (e) {
    throw e;
  }
  topic
    .save()
    .then((topicSaved) => {
      res.status(201).json(topicSaved);
    })
    .catch(err => next(err));
}

function index(req, res) {
  Topic.find()
    .then((topics) => {
      res.send(topics);
    }).catch((err) => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving topics.'
      });
    });
}

function show(req, res) {
  Topic.findById(req.params.id, async (err, topic) => {
    if (err) return;

    const posts = await Post.find({ topics: { $in: [ObjectId(req.params.id)] } });

    const body = {
      topic,
      posts
    };
    res.send(body);
  });
}

function update(req, res) {
  Topic.findByIdAndUpdate(req.params.id, { $set: req.body }, (err) => {
    if (err) return;
    res.send('Topic udpated.');
  });
}

function deleteTopic(req, res) {
  const { user } = req;
  if (user && user.admin) {
    Topic.findByIdAndUpdate(req.params.id, { $set: { status: 'deleted' } }, (err) => {
      if (err) return;
      res.send('Topic deleted.');
    });
  } else {
    res.send('Only admin can delete topic.');
  }
}


/**
  * @swagger
  * /topics:
  *   post:
  *     summary: Create new topic
  *     description: Create new topic by current user.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   get:
  *     summary: Get topics index
  *     description: Get list of topics.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  * /topics/{topicId}:
  *   get:
  *     summary: Get topic
  *     description: Get topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   update:
  *     summary: Update topic
  *     description: Update topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *   delete:
  *     summary: Delete topic
  *     description: Delete topic by id.
  *     tags: [topic]
  *     security:
  *       - Token: []
  *     responses:
  *       '200':
  *         description: successful operation
  *         schema:
  *           type: array
  *           items:
  *             $ref: '#/definitions/Post'
  *
  */

export default {
  create,
  index,
  show,
  update,
  deleteTopic
};
