import config from '../../config/config';
import CronItem from '../helpers/cronItem.helper';

import Post from '../models/post.model';

async function callback() {
  const post = await Post.findById('5913c0794ee01db33cacce8c');
  console.log(JSON.stringify(post, null, 4));
}

const RSSPublic = {
  name: 'RSSPublic',
  time: config.cron.RSS.time,
  timeZone: config.cron.RSS.timeZone,
  runOnInit: true,
  callback,
};

module.exports = new CronItem(RSSPublic);
