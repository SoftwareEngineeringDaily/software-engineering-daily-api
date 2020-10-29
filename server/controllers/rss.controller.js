import { isActive } from './subscription.controller';

function publicFeedAll(req, res) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.status(200).send(req.app.get('rssFeedPublicAll'));
}

function publicFeed(req, res) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.status(200).send(req.app.get('rssFeedPublic'));
}

async function privateFeed(req, res) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');

  const subscriptionId = Buffer.from(req.params.id, 'base64').toString('utf8');

  if (!await isActive(subscriptionId)) return res.status(404).send();

  return res.status(200).send(req.app.get('rssFeedPrivate'));
}

export default {
  publicFeedAll,
  publicFeed,
  privateFeed,
};
