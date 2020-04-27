import async from 'async';
import Question from '../models/question.model';

async function get(req, res) {
  const question = await Question.findById(req.params.id);

  if (!question) return res.status(404).send('Not found');

  return res.json(question.toObject());
}

async function create(req, res) {
  const {
    entityId, entityType, content, questions
  } = req.body;

  if (!entityId || !entityType || (!content && !questions)) return res.status(400).send('Missing data');

  const series = [];
  const saved = [];
  let contents = [];

  if (content) {
    contents.push(content.trim());
  }
  if (questions) {
    contents = questions.filter(q => !!q);
  }

  questions.forEach((questionContent) => {
    series.push((callback) => {
      const question = new Question({ entityId, entityType, content: questionContent.trim() });
      question.save()
        .then((dbQuestion) => {
          saved.push(dbQuestion);
          callback();
        })
        .catch(callback);
    });
  });

  return async.series(series, (err) => {
    if (err) return res.status(500).end(err.message ? err.message : err.toString());
    if (saved.length === 1) return res.json(saved[0]);
    return res.json(saved);
  });
}

async function getByEntity(req, res) {
  const { entityType, entityId } = req.params;
  const questions = await Question.find({
    entityType,
    entityId,
    $or: [{ deleted: false }, { deleted: { $exists: false } }]
  })
    .populate({
      path: 'answers',
      populate: {
        path: 'author',
        select: 'name lastName avatarUrl',
        where: { $or: [{ deleted: false }, { deleted: { $exists: false } }] }
      }
    })
    .exec();

  if (!questions) res.json([]);

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
