const mongoose = require('mongoose');
const StorySchema = new mongoose.Schema({
  storyId: String,
  password: String
});
mongoose.model('Story', StorySchema);

module.exports = mongoose.model('Story');