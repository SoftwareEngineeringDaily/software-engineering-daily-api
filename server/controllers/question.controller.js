import Question from '../models/question.model';

async function get(req, res) {
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

  return res.json(question.toObject());
}

async function create(req, res) {
  const { entityId, entityType, content } = req.body;

  if (!entityId || !entityType || !content) return res.status(400).send('Missing data');

  const question = new Question({ entityId, entityType, content: content.trim() });

  try {
    const saved = await question.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function getByEntity(req, res) {
  const { entityType, entityId } = req.params;
  const questions = await Question.find({ entityType, entityId })
    .populate({
      path: 'answers',
      populate: {
        path: 'author',
        select: 'name lastName avatarUrl'
      }
    })
    .exec();

  if (!questions) return res.status(404).send('Not found');

  return res.json(questions);
}

async function update(req, res) {
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

  Object.keys(req.body).forEach((key) => {
    question[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
  });

  question.dateUpdated = new Date();

  try {
    const saved = await question.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function deleteQuestion(req, res) {
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

  question.deleted = true;
  question.dateUpdated = new Date();

  try {
    const saved = await question.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

export default {
  get,
  getByEntity,
  create,
  update,
  delete: deleteQuestion
};
