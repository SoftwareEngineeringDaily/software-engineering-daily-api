
import mongoose, { Schema } from 'mongoose';

const CompanySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  externalUrl: {
    type: String,
    required: false
  },
  localUrl: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Company', CompanySchema);
