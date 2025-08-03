const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  problem_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  description: { type: String, required: true },
  examples: { type: Array, required: true },
  constraints: { type: Array, required: true },
  starter_code: { type: Object, required: true },
  // This field isn't used yet, so we'll make it optional
  public_test_cases: { type: Array, required: false }, 
  // This is the field we will use for validation
  hidden_test_cases: { type: Array, required: true, select: false } 
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;