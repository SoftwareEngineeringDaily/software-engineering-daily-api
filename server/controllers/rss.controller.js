
function publicFeed(req, res) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.status(200).send(req.app.get('rssFeed'));
}

export default {
  publicFeed
};
