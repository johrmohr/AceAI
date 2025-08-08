// server/routes/feedback.js
const express = require('express');
const router = express.Router();
const { getAIFeedback, getFinalInterviewFeedback } = require('../services/aiService');
const Problem = require('../models/Problem');

router.post('/', async (req, res) => {
    const { code, transcript, problemId } = req.body;

    if (!code || !problemId) {
        return res.status(400).json({ message: 'Code and problemId are required.' });
    }

    try {
        const problem = await Problem.findOne({ problem_id: problemId });
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }

        const feedback = await getAIFeedback(code, transcript, problem);
        res.json({ feedback });

    } catch (error) {
        console.error('Error in feedback route:', error);
        res.status(500).json({ message: 'Server error while generating feedback.' });
    }
});

module.exports = router;

// Final feedback route
// Expects: { code, transcript, problemId, validationSummary, validationResults }
router.post('/final', async (req, res) => {
    const { code, transcript, problemId, validationSummary, validationResults } = req.body;
    if (!problemId) {
        return res.status(400).json({ message: 'problemId is required.' });
    }
    try {
        const problem = await Problem.findOne({ problem_id: problemId });
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found.' });
        }
        const feedback = await getFinalInterviewFeedback({
            code: code || '',
            transcript: transcript || '',
            problem,
            validationSummary: validationSummary || null,
            validationResults: validationResults || null,
        });
        res.json({ feedback });
    } catch (error) {
        console.error('Error in final feedback route:', error);
        res.status(500).json({ message: 'Server error while generating final feedback.' });
    }
});
