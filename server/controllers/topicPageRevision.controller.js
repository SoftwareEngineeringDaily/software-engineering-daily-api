
import TopicPageRevision from '../models/topicPageRevision.model';

async function create(topicPage, user) {
  const revision = new TopicPageRevision({
    topicPage: topicPage._id,
    author: user._id,
    content: topicPage.content,
    logo: topicPage.logo,
    revision: topicPage.lastRevision ? topicPage.lastRevision + 1 : 1,
  });

  const saved = await revision.save();
  return saved;
}

async function getAll(topicPageId) {
  const revisions = await TopicPageRevision.find({ topicPage: topicPageId })
    .select('author revision dateCreated topicPage')
    .populate('author', 'name lastName avatarUrl');

  revisions.sort((a, b) => {
    if (!b) return -1;
    return b.dateCreated - a.dateCreated;
  });

  return revisions;
}

export default {
  create,
  getAll,
};
