import mongoose from 'mongoose';
import config from '../../config/config';

// Create schema
const AnswerSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  content: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  deleted: { type: Boolean }
});

// Export the model
module.exports = mongoose.model(`${config.mongo.collectionPrefix}Answer`, AnswerSchema);
