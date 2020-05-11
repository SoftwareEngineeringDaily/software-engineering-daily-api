import mongoose from 'mongoose';
import every from 'lodash/every';
import httpStatus from 'http-status';
import Topic from '../models/topic.model';
import TopicPage from '../models/topicPage.model';
import RelatedLink from '../models/relatedLink.model';
import { signS3 } from '../helpers/s3';
import config from '../../config/config';
import { mailTemplate } from '../helpers/mail';
import User from '../models/user.model';

function checkMaintainer(req, topic) {
  const maintainers = topic.maintainers || [];
  const hasMaintainers = (maintainers.length > 0 && every(maintainers, '_id'));
  const hasUser = (req.user && req.user._id);

  return (
    hasUser &&
    hasMaintainers &&
    maintainers.filter(m => req.user._id.toString() === m._id.toString()).length
  );
}

async function createTopicPage(topicId) {
  let topicPage = await TopicPage.findOne({ topic: topicId })
    .populate('history.user', 'name avatarUrl isAdmin');

  if (!topicPage) {
    const topic = await Topic.findById(topicId);

    if (!topic) return false;

    topicPage = new TopicPage({
      topic: topicId,
      content: ''
    });

    const saved = await topicPage.save();
    topic.topicPage = topicPage._id;
    await topic.save();
    return saved;
  }

  return topicPage;
}

async function get(req, res) {
  const options = {
    $or: [{ slug: req.params.slug }]
  };

  if (mongoose.Types.ObjectId.isValid(req.params.slug)) {
    options.$or.push({ _id: req.params.slug });
  }

  const topic = await Topic
    .findOne(options)
    .populate('maintainers', 'name lastName email website avatarUrl isAdmin bio');

  if (!topic) {
    return res.status(404).send(`Topic ${req.params.slug} not found`);
  }

  let topicPage = await TopicPage.findOne({ topic: topic._id })
    .populate('history.user', 'name avatarUrl isAdmin');

  let status = 200;

  if (!topicPage) {
    topicPage = await createTopicPage(topic._id);
    status = 201;
  }
  return res.status(status).send({ topic, topicPage });
}

async function update(req, res) {
  const topic = await Topic.findOne({ slug: req.params.slug })
    .populate('maintainers', 'name lastName email avatarUrl isAdmin');

  if (!topic) return res.status(404).send(`Topic ${req.params.slug} not found`);

  const topicPage = await TopicPage.findOne({ topic: topic._id });

  if (!topicPage) return res.status(404).send(`Topic Page ${req.params.slug} not found`);

  if (!checkMaintainer(req, topic)) return res.status(403).send('Not authorized');

  topicPage.history = topicPage.history.concat(new TopicPage.History({
    user: req.user._id,
    event: req.body.event
  }));

  if (req.body.content) topicPage.content = req.body.content;
  if (req.body.logo) topicPage.logo = req.body.logo;
  topicPage.published = req.body.published || false;

  topic.topicPage = topicPage._id;

  try {
    await topic.save();
    await topicPage.save();
    if (req.body.published !== undefined) mailAdminsPublish(topicPage, topic);
    return res.status(200).send('Saved');
  } catch (e) {
    return res.status(404).send(`Error saving: ${e.message || e}`);
  }
}

async function publish(req, res) {
  req.body.event = 'publish';
  req.body.published = true;

  update(req, res);
}

async function unpublish(req, res) {
  req.body.event = 'unpublish';
  req.body.published = false;

  update(req, res);
}

async function mailAdminsPublish(topicPage, topic) {
  const admins = await User.find({ isAdmin: true }).lean().exec();

  if (!admins.length) return;

  admins.forEach((admin) => {
    mailTemplate.topicPublish({
      to: admin.email,
      subject: 'New topic publish status',
      data: {
        user: admin.name,
        maintainer: (topic.maintainer) ? topic.maintainer.name : '-',
        publish: (topicPage.published) ? 'Published' : 'Unpublished',
        topicPage: topic.name,
        topicLink: `http://softwaredaily.com/topic/${topic.slug}`
      }
    });
  });
}

async function showContent(req, res) {
  const options = {
    $or: [{ slug: req.params.slug }]
  };

  if (mongoose.Types.ObjectId.isValid(req.params.slug)) {
    options.$or.push({ _id: req.params.slug });
  }

  const topic = await Topic
    .findOne(options)
    .populate('maintainers', 'name lastName email website avatarUrl isAdmin bio');

  if (!topic) {
    return res.status(404).send(`Topic ${req.params.slug} not found`);
  }

  const topicPage = await TopicPage.findOne({ topic: topic._id });

  return res.status(200).json({ topic, topicPage });
}

async function relatedLinks(req, res) {
  const { slug } = req.params;
  const topic = await Topic.findOne({ slug });
  const topicPage = await TopicPage.findOne({ topic: topic._id });

  RelatedLink.list({ topicPage: topicPage._id, user: req.user })
    .then((links) => {
      res.json(links);
    });
}

async function getImages(req, res) {
  const { slug } = req.params;
  const topic = await Topic.findOne({ slug });
  const topicPage = await TopicPage.findOne({ topic: topic._id })
    .lean()
    .exec();

  if (!topicPage) {
    return res.json([]);
  }

  const images = topicPage.images.filter(img => !img.deleted);

  return res.json(images);
}

async function signS3ImageUpload(req, res) {
  const { fileType } = req.body;
  const randomNumberString = `${Math.random()}`;
  const type = getFileType(fileType);
  const newFileName = `topic_images/${randomNumberString.replace('.', '_')}${type}`;

  const cbSuccess = (result) => {
    createImage(req, res, result);
  };

  // eslint-disable-next-line
  const cbError = err => {
    if (err) {
      console.log(err); // eslint-disable-line
      return res.status(httpStatus.SERVICE_UNAVAILABLE).send('There was a problem getting a signed url');
    }
  };
  signS3(config.aws.topicBucketName, fileType, newFileName, cbSuccess, cbError);
}

async function createImage(req, res, result) {
  const { slug } = req.params;
  const topic = await Topic.findOne({ slug });
  const image = new TopicPage.Image({
    user: req.user._id,
    url: result.url,
  });

  await TopicPage.update({ topic: topic._id }, {
    $push: {
      images: { $each: [image], $position: 0 }
    }
  });

  res.write(JSON.stringify(result));
  res.end();
}

const types = [
  { type: 'image/png', fileType: '.png' },
  { type: 'image/gif', fileType: '.gif' },
  { type: 'image/jpeg', fileType: '.jpg' }
];

function getFileType(fileType) {
  const type = types.find(t => t.type === fileType);
  return type ? type.fileType : '';
}

async function signS3LogoUpload(req, res) {
  const { fileType } = req.body;
  const randomNumberString = `${Math.random()}`;
  const type = getFileType(fileType);
  const newFileName = `topic_images/${randomNumberString.replace('.', '_')}${type}`;

  const cbSuccess = (result) => {
    changeLogo(req, res, result);
  };

  // eslint-disable-next-line
  const cbError = err => {
    if (err) {
      console.log(err); // eslint-disable-line
      return res.status(httpStatus.SERVICE_UNAVAILABLE).send('There was a problem getting a signed url');
    }
  };
  signS3(config.aws.topicBucketName, fileType, newFileName, cbSuccess, cbError);
}

async function changeLogo(req, res, result) {
  const { slug } = req.params;
  const topic = await Topic.findOne({ slug });

  const topicPage = await TopicPage.findOne({ topic: topic._id });

  if (topicPage) {
    topicPage.logo = result.url;
    await topicPage.save();
  }

  res.write(JSON.stringify(result));
  res.end();
}

async function deleteImage(req, res) {
  const { slug, imageId } = req.params;
  const topic = await Topic.findOne({ slug });
  const topicPage = await TopicPage.findOne({ topic: topic._id });

  const image = topicPage.images.find(img => img._id.toString() === imageId.toString());

  if (!image) return res.status(404).send('Image not found');

  image.deleted = true;

  await topicPage.save();

  return res.send('Deleted');
}

async function recentPages(req, res) {
  const topicPages = await TopicPage.find()
    .sort('-dateUpdated')
    .populate('topic', 'maintainer status name slug')
    .limit(50);

  const result = topicPages.filter((topicPage) => {
    return topicPage.topic && topicPage.published;
  }).map((topicPage) => {
    return {
      name: topicPage.topic.name,
      slug: topicPage.topic.slug
    };
  });

  res.json(result.slice(0, 30));
}

export default {
  get,
  createTopicPage,
  update,
  publish,
  unpublish,
  showContent,
  relatedLinks,
  getImages,
  signS3ImageUpload,
  signS3LogoUpload,
  deleteImage,
  recentPages
};
