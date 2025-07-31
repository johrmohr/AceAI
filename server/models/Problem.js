const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  problem_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  description: { type: String, required: true },
  examples: { type: Array, required: true },
  constraints: { type: Array, required: true },
  starter_code: { type: Object, required: true },
  public_test_cases: { type: Array, required: true }, // Visible to users
  hidden_test_cases: { type: Array, required: true, select: false } // Only for backend validation
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem; 