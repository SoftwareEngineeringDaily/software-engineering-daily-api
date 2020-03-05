import Like from '../models/like.model';
import Favorite from '../models/favorite.model';
import { getAdFreeMp3 } from '../helpers/mp3.helper';
import { getPrivateRss } from '../helpers/rss.helper';

function replaceWithAdFree(post, fullUser) {
  post.mp3 = getAdFreeMp3(post.mp3) // eslint-disable-line
  post.rss = getPrivateRss(fullUser) // eslint-disable-line
}

async function addPostData(post, fullUser) {
  const query = {
    userId: fullUser ? fullUser._id : null,
    postId: post._id,
  };

  const likeActive = await Like
    .findOne(query)
    .exec(l => Promise.resolve(l));

  const bookmark = await Favorite
    .findOne(query)
    .exec(l => Promise.resolve(l));

  post.likeCount = post.likeCount || 0 // eslint-disable-line
  post.totalFavorites = post.totalFavorites || 0 // eslint-disable-line
  post.likeActive = !!(likeActive) // eslint-disable-line
  post.bookmarkActive = !!(bookmark && bookmark.active) // eslint-disable-line
  post.rss = '/rss/public/all' // eslint-disable-line

  if (fullUser && fullUser.subscription && fullUser.subscription.active) {
    replaceWithAdFree(post, fullUser);
  }

  return post;
}

async function getAdFreePostsIfSubscribed(posts, fullUser) {
  if (!fullUser) {
    return posts;
  }

  // Here we do this so we can
  // fetch subscriptions:
  const _posts = posts.map(async (post) => {
    return await addPostData(post, fullUser); // eslint-disable-line
  });

  return Promise.all(_posts);
}

export {
  replaceWithAdFree,
  addPostData,
  getAdFreePostsIfSubscribed,
};
