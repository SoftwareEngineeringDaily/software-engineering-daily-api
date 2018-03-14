const Feed = require('feed');

import config from '../../config/config';

function replaceWithAdFree(post) {
  console.log('--mp3', post.toObject().mp3);  
  console.log('--post', post);
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
  console.log("---done", post, post.mp3)
  return post;
}

function getAdFreeSinglePostIfSubscribed(post, fullUser, next) {
  if (true) {
    return replaceWithAdFree(post, next);
  }
  return post;
}

function getAdFreePostsIfSubscribed(posts, fullUser, next) {
  if (true) {
    // Here we do this so we can fetch subscritions:
    const _posts = posts.map(post => replaceWithAdFree(post, next));
    return _posts;
  }
  return posts;
}

function convertPostsToAdFreeRssFeed(posts, fullUser) {
  if (true) {
    // Convert posts to ad free posts
    const adfree = getAdFreePostsIfSubscribed(posts, fullUser, next);
    const rssepisodes = adfree.map(post => convertToRssItem(post, next));
    // Build RSS feed options
    const feed = new Feed({
      title: 'SE Daily Ad-Free Feed',
      description: 'Ad-free RSS feed for Software Engineering Daily',
      id: `${config.baseUrl}/adfreerss`,
      link: config.baseUrl,
      image: 'http://softwareengineeringdaily.com/wp-content/uploads/powerpress/SED_square_solid_bg.png',
      generator: 'SEDaily Open Source Project',
      author: {
        name: 'Software Engineering Daily',
        email: 'softwareengineeringdaily@gmail.com',
        link: config.baseUrl
      }
    });
    rssepisodes.forEach((post) => {
      feed.addItem({
        title: post.title.rendered,
      });
    });
  }
}

export { replaceWithAdFree, getAdFreeSinglePostIfSubscribed, getAdFreePostsIfSubscribed };
