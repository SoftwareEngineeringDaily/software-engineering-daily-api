import mongoose from 'mongoose';
import config from '../../config/config';

const TopicPageHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: String },
  revision: { type: Number },
  dateCreated: { type: Date, default: Date.now },
});

const TopicPageImageSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  url: { type: String },
  deleted: { type: Boolean, default: false },
  dateCreated: { type: Date, default: Date.now },
});

const TopicPageSchema = new mongoose.Schema({
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  content: { type: String },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  logo: { type: String, default: '' },
  published: { type: Boolean, default: false },
  revision: { type: Number },
  lastRevision: { type: Number },
  twitterAccounts: { type: Array, default: [] },
  history: [TopicPageHistorySchema],
  images: [TopicPageImageSchema],
  searchIndex: { type: String },
});

TopicPageSchema.pre('save', function onSave(next) {
  const doc = this;
  doc.dateUpdated = Date.now;
  next();
});

// Export the model
module.exports = mongoose.model(`${config.mongo.collectionPrefix}TopicPage`, TopicPageSchema);
module.exports.History = mongoose.model(`${config.mongo.collectionPrefix}TopicPageHistory`, TopicPageHistorySchema);
module.exports.Image = mongoose.model(`${config.mongo.collectionPrefix}TopicPageImage`, TopicPageImageSchema);
