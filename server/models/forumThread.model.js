import mongoose from 'mongoose';

const ForumThreadSchema = new mongoose.Schema({
  id: String,
  score: { type: Number, default: 0 },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, default: Date.now }
});

ForumThreadSchema.statics = {
  list() {
    return this.find()
      .exec();
  }
};

export default mongoose.model('ForumThread', ForumThreadSchema);
