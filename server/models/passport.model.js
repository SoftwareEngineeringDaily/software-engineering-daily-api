import mongoose, { Schema } from 'mongoose';
import config from '../../config/config';

/**
 * Passport Schema
 */
const PassportSchema = new Schema({
  expired: { type: Number, default: 0 },
  accessToken: { type: String },
  provider: { type: String, default: 'twitter' },
  identifier: { type: String, unique: true },
  tokens: { type: Object },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model(`${config.mongo.collectionPrefix}Passport`, PassportSchema);
