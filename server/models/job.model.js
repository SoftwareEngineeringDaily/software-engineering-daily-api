import mongoose, { Schema } from 'mongoose';

const JobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  applicationEmailAddress: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [{
    type: Number
  }],
  employmentType: {
    type: String,
    required: true,
    enum: [
      'Permanent',
      'Contract'
    ]
  },
  remoteWorkingConsidered: Boolean,
  postedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  expirationDate: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('Job', JobSchema);
