import Answer from '../models/answer.model';
import Question from '../models/question.model';

async function get(req, res) {
  const answer = await Answer.findById(req.params.id);

  if (!answer) return res.status(404).send('Not found');

  return res.json(answer.toObject());
}

async function create(req, res) {
  const { question: questionId, content } = req.body;

  if (!questionId || !content) return res.status(400).send('Missing data');

  const question = await Question.findById(questionId);

  if (!question) return res.status(404).send('Question not found');

  if (!req.user) return res.status(401).send('Need to be logged');

  const answer = new Answer({
    question: question._id,
    content,
    author: req.user._id
  });

  try {
    const saved = await answer.save();

    question.answers = question.answers.concat([saved._id]);
    await question.save();

    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function update(req, res) {
  if (!req.body.content) return res.status(400).send('Missing data');

  const answer = await Answer.findById(req.params.id);

  if (!answer) return res.status(404).send('Not found');

  if (!req.user) return res.status(401).send('Need to be logged');

  if (answer.author.toString() !== req.user._id.toString()) {
    return res.status(401).send('You are not the author of this answer');
  }

  answer.content = req.body.content.trim();
  answer.dateUpdated = new Date();

  try {
    const saved = await answer.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function deleteAnswer(req, res) {
  const answer = await Answer.findById(req.params.id);

  if (!answer) return res.status(404).send('Not found');

  answer.deleted = true;
  answer.dateUpdated = new Date();

  try {
    const saved = await answer.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

async function vote(req, res) {
  const answer = await Answer.findById(req.params.id);

  if (!answer) return res.status(404).send('Not found');

  if (!req.user) return res.status(401).send('Need to be logged');

  if (answer.author.toString() === req.user._id.toString()) {
    return res.status(401).send('Can\'t vote on own answer');
  }

  const ownVoted = answer.votes.find(v => v.toString() === req.user._id.toString());

  if (ownVoted) {
    answer.votes = answer.votes.filter(v => v.toString() !== req.user._id.toString());
  } else {
    answer.votes = answer.votes.concat([req.user._id]);
  }

  try {
    const saved = await answer.save();
    return res.json(saved.toObject());
  } catch (e) {
    return res.status(500).end(e.message ? e.message : e.toString());
  }
}

export default {
  get,
  create,
  update,
  delete: deleteAnswer,
  vote
};