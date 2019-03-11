import mongoose from 'mongoose';

// Create schema
const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  slug: String,
  postCount: { type: Number, default: 0 },
  status: { type: String, default: 'active' }
});

// Export the model
module.exports = mongoose.model('Topic', TopicSchema);
