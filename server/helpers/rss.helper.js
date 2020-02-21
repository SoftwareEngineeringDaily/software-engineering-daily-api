function getPrivateRss(user) {
  if (!user || !user.subscription || !user.subscription.active) return '/rss/public/all';
  const rssPrivateCode = Buffer.from(user.subscription._id.toString(), 'utf8').toString('base64');
  return `/rss/private/${rssPrivateCode}`;
}

export default {
  getPrivateRss
};
