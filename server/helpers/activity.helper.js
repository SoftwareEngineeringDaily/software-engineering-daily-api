import moment from 'moment';
import { groupBy } from 'lodash';
import Comment from '../models/comment.model';
import RelatedLink from '../models/relatedLink.model';
import Post from '../models/post.model';

async function getActivityTree(userId, days) {
  const limitDate = moment().subtract(days, 'days');

  const cachedPosts = [];

  const comments = await getComments(userId, limitDate);
  await populatePosts({
    data: comments,
    field: 'rootEntity',
    postField: 'thread',
    cachedPosts
  });

  const relatedLinks = await getRelatedLinks(userId, limitDate);
  await populatePosts({
    data: relatedLinks,
    field: 'post',
    postField: '_id',
    cachedPosts
  });

  const activities = comments.concat(relatedLinks);

  activities.sort((o1, o2) => {
    return o1.dateCreated >= o2.dateCreated ? -1 : 1;
  });

  return groupBy(activities, 'groupDate');
}

async function getComments(userId, limitDate) {
  return Comment.find({
    author: userId,
    dateCreated: { $gte: limitDate.toDate() },
    deleted: false
  })
    .select('rootEntity dateCreated highlight')
    .sort('-dateCreated')
    .lean()
    .exec()
    .map((item) => {
      return { ...item, activityType: 'comment', groupDate: moment(item.dateCreated).format('YYYY-MM-DD') };
    });
}

async function getRelatedLinks(userId, limitDate) {
  return RelatedLink.find({
    author: userId,
    dateCreated: { $gte: limitDate.toDate() },
    deleted: false
  })
    .select('post url dateCreated title, type')
    .sort('-dateCreated')
    .lean()
    .exec()
    .map((item) => {
      return { ...item, activityType: 'relatedLink', groupDate: moment(item.dateCreated).format('YYYY-MM-DD') };
    });
}

// populates post info from a cached array of posts that
// exists for this request
async function populatePosts(options) {
  for (let i = 0; i < options.data.length; i += 1) {
    const item = options.data[i];
    const find = item[options.field];
    let post = options.cachedPosts.find(p => p[options.postField || '_id'].toString() === find.toString());
    if (!post) {
      try {
        post = await getPost(find); // eslint-disable-line no-await-in-loop
        if (post) {
          post = post.toObject();
          post.title = post.title.rendered;
          post.url = `/post/${post._id}/${post.slug}`;
          options.cachedPosts.push(post);
        }
      } catch (e) {
        console.error(e);
      }
    }
    item.post = post; // eslint-disable-line no-param-reassign
  }
  return options.data;
}

async function getPost(threadId) {
  return Post.findOne({ thread: threadId })
    .select('slug title thread')
    .exec();
}

export default {
  getActivityTree
};
