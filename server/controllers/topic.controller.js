import Topic from '../models/topic.model';

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
  Topic.findById(req.params.id, (err, topic) => {
    if (err) return;
    res.send(topic);
  });
}

function update(req, res) {
  Topic.findByIdAndUpdate(req.params.id, { $set: req.body }, (err) => {
    if (err) return;
    res.send('Topic udpated.');
  });
}

function deleteTopic(req, res) {
  Topic.findByIdAndUpdate(req.params.id, { $set: { status: 'deleted' } }, (err) => {
    if (err) return;
    res.send('Topic deleted.');
  });
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
