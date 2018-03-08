import mongoose from 'mongoose';

const ForumThreadSchema = new mongoose.Schema({
  id: String,
  score: { type: Number, default: 0 },
  title: {
    rendered: String,
    required: true
  },
  content: {
    rendered: String,
    required: true
  },
  date: { type: Date, default: Date.now }
});

export default mongoose.model('ForumThread', ForumThreadSchema);
