import config from '../../config/config';

function replaceWithAdFree(post, next) {
  try {
    const originalMP3Split = post.mp3.split('/');
    if( originalMP3Split.length > 0 ) {
      const fileName =  originalMP3Split[originalMP3Split.length -1];
      const newFileName = fileName.replace('.mp3', '_adfree.mp3');
      post.mp3 = config.adFreeURL + newFileName;
    }
  } catch(e) {
    console.log('error', e);
    next(e);
  }
  return post;
}


function getAdFreeSinglePostIfSubscribed(post, fullUser) {
   if (req.fullUser && req.fullUser.subscription && req.fullUser.subscription.active ) {
     return
   }
}

function getAdFreePostsIfSubscribed(posts, fullUser, next) {
  if (fullUser && fullUser.subscription && fullUser.subscription.active ) {
    // Here we do this so we can fetch subscritions:
    const _posts = posts.map( (post) => { return replaceWithAdFree(post, next); });
    return _posts;
  } else {
    return posts;
  }
}



export { replaceWithAdFree, getAdFreeSinglePostIfSubscribed, getAdFreePostsIfSubscribed };
