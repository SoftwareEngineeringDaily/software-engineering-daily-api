import Comment from '../models/comment.model';
import RelatedLink from '../models/relatedLink.model';
import Topic from '../models/topic.model';

const getEpisodeCount = async (author) => {
  const count = await RelatedLink
    .find({
      type: 'episode',
      deleted: false,
      author,
    })
    .count();

  const percent = Math.min(count / 5, 1) * 100;
  const completed = (percent === 100);
  const label = completed
    ? 'Added 5 Related Episodes'
    : 'Add 5 Related Episodes';

  return {
    count,
    label,
    percent,
    icon: completed ? 'fa-trophy' : 'fa-podcast',
    completed,
  };
};

const getHighlightCount = async (author) => {
  const count = await Comment
    .find({
      highlight: {
        $exists: true,
      },
      deleted: false,
      author,
    })
    .count();

  const percent = Math.min(count / 5, 1) * 100;
  const completed = (percent === 100);
  const label = completed
    ? 'Added 5 Highlights'
    : 'Add 5 Highlights';

  return {
    count,
    label,
    percent,
    icon: completed ? 'fa-trophy' : 'fa-quote-left',
    completed,
  };
};

const getTopicCount = async (maintainer) => {
  const count = await Topic
    .find({
      status: 'active',
      maintainer,
    })
    .count();

  const percent = Math.min(count, 1) * 100;
  const completed = (percent === 100);
  const label = completed
    ? 'Wrote 1 Topic Page'
    : 'Write 1 Topic Page';

  return {
    count,
    label,
    percent,
    icon: completed ? 'fa-trophy' : 'fa-pencil-square',
    completed,
  };
};

const getBadges = async (userId) => {
  const episode = await getEpisodeCount(userId);
  const highlight = await getHighlightCount(userId);
  const topic = await getTopicCount(userId);

  return [
    episode,
    highlight,
    topic,
  ];
};

export default {
  getBadges
};
