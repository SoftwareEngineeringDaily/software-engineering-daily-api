import { getAdFreeMp3 } from '../helpers/mp3.helper';
import { getPrivateRss } from '../helpers/rss.helper';

function replaceWithAdFree(post, fullUser) {
  post.mp3 = getAdFreeMp3(post.mp3); // eslint-disable-line
  post.rss = getPrivateRss(fullUser) // eslint-disable-line
}

function addPostData(post, fullUser) {
  post.rss = '/rss/public/all'; // eslint-disable-line
  if (fullUser && fullUser.subscription && fullUser.subscription.active) {
    replaceWithAdFree(post, fullUser);
  }
  return post;
}

function getAdFreePostsIfSubscribed(posts, fullUser) {
  if (fullUser && fullUser.subscription && fullUser.subscription.active) {
    // Here we do this so we can fetch subscritions:
    const _posts = posts.map(post => addPostData(post, fullUser));
    return _posts;
  }
  return posts;
}

export { replaceWithAdFree, addPostData, getAdFreePostsIfSubscribed };
