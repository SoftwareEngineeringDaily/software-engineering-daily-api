import config from '../../config/config';

function replaceWithAdFree(post) {
  try {
    const originalMP3Split = post.mp3.split('/');
    if (originalMP3Split.length > 0) {
      const fileName = originalMP3Split[originalMP3Split.length - 1];
      const newFileName = fileName.replace('.mp3', '_adfree.mp3');
      post.mp3 = config.adFreeURL + newFileName; // eslint-disable-line
    }
  } catch (e) {
    console.log('Error, could not get mp3', post, e); // eslint-disable-line
    // next(e); // We don't want to do this since it could still return posts.
  }
  return post;
}

function getAdFreeSinglePostIfSubscribed(post, fullUser, next) {
  if (fullUser && fullUser.subscription && fullUser.subscription.active) {
    return replaceWithAdFree(post, next);
  }
  return post;
}

function getAdFreePostsIfSubscribed(posts, fullUser, next) {
  if (fullUser && fullUser.subscription && fullUser.subscription.active) {
    // Here we do this so we can fetch subscritions:
    const _posts = posts.map(post => replaceWithAdFree(post, next));
    return _posts;
  }
  return posts;
}

export { replaceWithAdFree, getAdFreeSinglePostIfSubscribed, getAdFreePostsIfSubscribed };
