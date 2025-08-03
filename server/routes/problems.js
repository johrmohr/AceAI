const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');

const executePythonInSandbox = (code, testCase) => {
  return new Promise(async (resolve, reject) => {
    // FIX: Replaced hyphens with underscores for valid Python module names
    const tempId = `temp_solution_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const tempFilePath = path.join(__dirname, `${tempId}.py`);
    const runnerPath = path.join(__dirname, `runner_${tempId}.py`);

    // This runner code is now more robust and will call the correct method.
    const runnerCode = `
import sys
import json
from ${tempId} import Solution

try:
    solver = Solution()
    test_input = json.load(sys.stdin)
    
    # Dynamically find and call the correct problem method
    if hasattr(solver, "twoSum"):
        result = solver.twoSum(**test_input)
    elif hasattr(solver, "isPalindrome"):
        result = solver.isPalindrome(**test_input)
    else:
        raise NotImplementedError("Could not find a valid method (e.g., twoSum, isPalindrome) in the Solution class.")
        
    print(json.dumps(result))
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;

    let timer;

    try {
      await fs.writeFile(tempFilePath, code);
      await fs.writeFile(runnerPath, runnerCode);

      const pythonProcess = spawn('python', [runnerPath]);

      let stdout = '';
      let stderr = '';

      timer = setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Execution timed out after 5 seconds.'));
      }, 5000);

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });
      pythonProcess.on('error', (err) => {
          clearTimeout(timer);
          reject(new Error(`Failed to start subprocess: ${err.message}`));
      });

      pythonProcess.on('close', async (code) => {
        clearTimeout(timer);

        try {
          await fs.unlink(tempFilePath);
          await fs.unlink(runnerPath);
        } catch (cleanupError) {
          console.error("Error during file cleanup:", cleanupError);
        }

        if (stderr) { return reject(new Error(stderr.trim())); }

        try {
          const actual = JSON.parse(stdout.trim());
          resolve({ success: true, actual });
        } catch (e) {
          reject(new Error('Failed to parse solution output.'));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(testCase.input));
      pythonProcess.stdin.end();

    } catch (e) {
      clearTimeout(timer);
      reject(e);
    }
  });
};


/**
 * A simple router for code execution based on language.
 * Currently only supports Python.
 */
const executeInSandbox = async (code, language, testCase) => {
    if (language === 'python') {
        return executePythonInSandbox(code, testCase);
    } else if (language === 'javascript') {
        // Placeholder for JavaScript execution
        return { success: false, actual: null, error: "JavaScript execution is not yet implemented." };
    } else {
        return { success: false, actual: null, error: `Language ${language} is not supported.` };
    }
};

/**
 * Runs all hidden test cases for a given problem submission.
 */
const runHiddenTestCases = async (code, language, testCases) => {
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    let result = {};
    try {
      const executionResult = await executeInSandbox(code, language, testCase);
      // Deep equality check for arrays/objects
      const passed = JSON.stringify(executionResult.actual) === JSON.stringify(testCase.output);
      
      result = {
        test_id: i + 1,
        passed,
        input: testCase.input,
        expected: testCase.output,
        actual: executionResult.actual,
      };
    } catch (error) {
      result = {
        test_id: i + 1,
        passed: false,
        input: testCase.input,
        expected: testCase.output,
        actual: null,
        error: error.message, // Capture the error message from the sandbox
      };
    }
    results.push(result);
  }
  
  return results;
};


// --- API Routes ---

// GET all problems
router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST to validate a user's solution
router.post('/:id/validate', async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // FIX 1: Select the correct field from the database
    const problem = await Problem.findOne({ problem_id: req.params.id }).select('+hidden_test_cases');
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // FIX 2: Pass the correct field to the runner function
    const results = await runHiddenTestCases(code, language, problem.hidden_test_cases);
    
    // Send back a successful response with the results payload
    res.status(200).json({
      problem_id: problem.problem_id,
      results: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: `An internal server error occurred: ${error.message}` });
  }
});

// GET problem by ID (without hidden test cases)
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findOne({ problem_id: req.params.id });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new problem (Admin)
router.post('/', async (req, res) => {
  const problem = new Problem(req.body);
  try {
    const newProblem = await problem.save();
    res.status(201).json(newProblem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update problem (Admin)
router.put('/:id', async (req, res) => {
  try {
    const problem = await Problem.findOneAndUpdate(
      { problem_id: req.params.id },
      req.body,
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE problem (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({ problem_id: req.params.id });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;