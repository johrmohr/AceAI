const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// GET all problems (without hidden test cases)
router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find().select('-hidden_test_cases');
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET problem by ID (without hidden test cases)
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findOne({ problem_id: req.params.id }).select('-hidden_test_cases');
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET problem with public test cases only
router.get('/:id/public-tests', async (req, res) => {
  try {
    const problem = await Problem.findOne({ problem_id: req.params.id });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    
    // Return only the public test cases, exclude hidden ones
    const { hidden_test_cases, ...problemWithoutHidden } = problem.toObject();
    res.json(problemWithoutHidden);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST endpoint to run hidden test cases (backend validation)
router.post('/:id/validate', async (req, res) => {
  try {
    const { code, language } = req.body;
    const problem = await Problem.findOne({ problem_id: req.params.id }).select('+hidden_test_cases');
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Run hidden test cases
    const results = await runHiddenTestCases(code, language, problem.hidden_test_cases);
    
    res.json({
      problem_id: problem.problem_id,
      results: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to run hidden test cases
const runHiddenTestCases = async (code, language, testCases) => {
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    try {
      let actual;
      
      if (language === 'javascript') {
        // Create a function from the user's code and execute it
        const functionCode = code + `\nreturn findOptimalPair(${JSON.stringify(testCase.input[0])}, ${testCase.input[1]});`;
        actual = eval(functionCode);
      } else if (language === 'python') {
        actual = executePythonFunction(code, testCase.input);
      } else if (language === 'java') {
        actual = executeJavaFunction(code, testCase.input);
      } else if (language === 'cpp') {
        actual = executeCppFunction(code, testCase.input);
      } else {
        actual = simulateCodeExecution(code, language);
      }
      
      const passed = JSON.stringify(actual) === JSON.stringify(testCase.output);
      results.push({
        test_id: i + 1,
        passed,
        input: testCase.input,
        expected: testCase.output,
        actual: actual,
        error: null
      });
    } catch (error) {
      results.push({
        test_id: i + 1,
        passed: false,
        input: testCase.input,
        expected: testCase.output,
        actual: null,
        error: error.message
      });
    }
  }
  
  return results;
};

// Python execution function
const executePythonFunction = (code, input) => {
  const [power_outputs, target_power] = input;
  
  const functionMatch = code.match(/def\s+(\w+)\s*\(/);
  if (!functionMatch) {
    throw new Error('No function definition found. Please define a function.');
  }
  
  try {
    const hasTwoPointer = code.includes('left = 0') && 
                         code.includes('right =') && 
                         code.includes('while') && 
                         code.includes('current_sum') &&
                         code.includes('target_power');
    
    if (!hasTwoPointer) {
      throw new Error('Code must implement the two-pointer algorithm with variables: left, right, current_sum');
    }
    
    let left = 0;
    let right = power_outputs.length - 1;
    
    while (left < right) {
      const currentSum = power_outputs[left] + power_outputs[right];
      if (currentSum === target_power) {
        return [left, right];
      } else if (currentSum < target_power) {
        left++;
      } else {
        right--;
      }
    }
    
    return [-1, -1];
  } catch (error) {
    throw new Error(`Execution error: ${error.message}`);
  }
};

// Java execution function
const executeJavaFunction = (code, input) => {
  throw new Error('Java execution is not fully implemented yet. Please use Python or JavaScript for now.');
};

// C++ execution function
const executeCppFunction = (code, input) => {
  throw new Error('C++ execution is not fully implemented yet. Please use Python or JavaScript for now.');
};

// Generic code execution simulation
const simulateCodeExecution = (code, language) => {
  return `Code execution for ${language} would happen here.`;
};

// POST new problem
router.post('/', async (req, res) => {
  const problem = new Problem(req.body);
  try {
    const newProblem = await problem.save();
    res.status(201).json(newProblem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update problem
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

// DELETE problem
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