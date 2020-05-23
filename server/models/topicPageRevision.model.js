import mongoose from 'mongoose';
import config from '../../config/config';

const TopicPageRevisionSchema = new mongoose.Schema({
  topicPage: { type: mongoose.Schema.Types.ObjectId, ref: 'TopicPage' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String },
  logo: { type: String, default: '' },
  revision: { type: Number, },
  dateCreated: { type: Date, default: Date.now },
});

// Export the model
module.exports = mongoose.model(`${config.mongo.collectionPrefix}TopicPageRevision`, TopicPageRevisionSchema);
