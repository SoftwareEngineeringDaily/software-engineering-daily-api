import mongoose from 'mongoose';

// Create schema
const TopicSchema = new mongoose.Schema({
  id: String,
  name: String,
  slug: String,
  postCount: { type: Number, default: 0 },
  status: { type: String, default: 'active' }
});

// Export the model
export default mongoose.model('Topic', TopicSchema);
