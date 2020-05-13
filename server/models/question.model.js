import mongoose from 'mongoose';
import config from '../../config/config';

// Create schema
const QuestionSchema = new mongoose.Schema({
  entityId: { type: String },
  author: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  entityType: { type: String },
  content: { type: String },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  deleted: { type: Boolean }
});

// Export the model
module.exports = mongoose.model(`${config.mongo.collectionPrefix}Question`, QuestionSchema);
