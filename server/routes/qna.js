/* server/routes/qna.js */
const express = require('express');
const router = express.Router();
const { getAIAnswerToQuestion } = require('../services/aiService');
const Problem = require('../models/Problem');

router.post('/', async (req, res) => {
  try {
    const { question, problemId } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'Missing question.' });
    }

    let problem = null;
    if (problemId) {
      problem = await Problem.findOne({ problem_id: problemId }).lean();
    }

    const answer = await getAIAnswerToQuestion({ question, problem });
    return res.status(200).json({ answer });
  } catch (err) {
    console.error('QnA route error:', err);
    return res.status(500).json({ message: 'Failed to generate answer.' });
  }
});

module.exports = router;


