import Twitter from 'twitter-lite';

const client = new Twitter({
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
});

/**
 * Get users search
 * @returns {[Users]}
 */
async function usersSearch(req, res) {
  const { q = '' } = req.query;

  if (!q) {
    return res.json([]);
  }

  try {
    let results = await client.get('users/search', { q });

    results = results.map(r => ({
      name: r.screen_name,
      label: `@${r.screen_name}`,
      displayName: r.name,
      screen_name: r.screen_name,
    }));

    return res.json(results);
  } catch (err) {
    return res
      .status(500)
      .send({
        message: err.message ? err.message : err,
      });
  }
}

export default {
  usersSearch,
};
