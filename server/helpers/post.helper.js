import algoliasearch from 'algoliasearch';
import Like from '../models/like.model';
import Favorite from '../models/favorite.model';
import { getAdFreeMp3 } from '../helpers/mp3.helper';
import { getPrivateRss } from '../helpers/rss.helper';

function replaceWithAdFree(post, fullUser) {
  post.mp3 = getAdFreeMp3(post.mp3) // eslint-disable-line
  post.rss = getPrivateRss(fullUser) // eslint-disable-line
}

async function getSearchQuery({
  search, topic, limit, createdAtBefore
}) {
  const client = algoliasearch(
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_API_KEY,
  );

  const index = client.initIndex(process.env.ALGOLIA_POSTS_INDEX);
  const timestamp = new Date(createdAtBefore).getTime();
  const searchQuery = {
    query: search,
    filters: `date_timestamp < ${timestamp}`,
    hitsPerPage: limit || 10,
  };

  if (topic) {
    searchQuery.filters += ` AND topics:${topic}`;
  }

  return new Promise((resolve, reject) => {
    index.search(searchQuery)
      .then((reply) => {
        return resolve({
          slug: {
            $in: reply.hits.map(h => h.slug),
          },
        });
      })
      .catch(e => reject(e));
  });
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
    return await addPostData( // eslint-disable-line
      typeof post.toObject === 'function' ? post.toObject() : post,
      fullUser,
    );
  });

  return Promise.all(_posts);
}

export {
  getSearchQuery,
  replaceWithAdFree,
  addPostData,
  getAdFreePostsIfSubscribed,
};
