/* seed.js */
const mongoose = require('mongoose');
const connectDB = require('./config/database');
const Problem = require('./models/Problem');

// Connect to DB
connectDB();

const sampleProblems = [
  {
    problem_id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] }
    ],
    constraints: [ "2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists." ],
    starter_code: {
      javascript: `var twoSum = function(nums, target) {\n    \n};`,
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass`
    },
    hidden_test_cases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, output: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, output: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, output: [0, 1] }
    ]
  },
  {
    problem_id: "palindrome-number",
    title: "Palindrome Number",
    difficulty: "Easy",
    description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
    examples: [
      { input: { x: 121 }, output: true },
      { input: { x: -121 }, output: false }
    ],
    constraints: [ "-2^31 <= x <= 2^31 - 1" ],
    starter_code: {
      javascript: `var isPalindrome = function(x) {\n    \n};`,
      python: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass`
    },
    hidden_test_cases: [
      { input: { x: 121 }, output: true },
      { input: { x: -121 }, output: false },
      { input: { x: 10 }, output: false },
      { input: { x: 0 }, output: true }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('Clearing existing problems...');
    await Problem.deleteMany({});
    
    console.log('Inserting sample problems...');
    await Problem.insertMany(sampleProblems);
    
    console.log('Database seeded successfully!');
    
    // --- VERIFICATION STEP ---
    console.log('\n--- Verifying Inserted Data ---');
    // We explicitly ask for the hidden_test_cases field to make sure it's readable
    const insertedProblem = await Problem.findOne({ problem_id: 'two-sum' }).select('+hidden_test_cases');
    
    if (insertedProblem) {
        console.log('✅ Successfully found "two-sum" problem after inserting.');
        const testCases = insertedProblem.hidden_test_cases;
        if (testCases && testCases.length > 0) {
            console.log(`✅ Found ${testCases.length} hidden test cases.`);
        } else {
            console.log('❌ ERROR: Found problem, but hidden_test_cases field is missing or empty.');
        }
    } else {
        console.log('❌ ERROR: Could not find "two-sum" problem after inserting. Seeding may have failed.');
    }

  } catch (error) {
    console.error('❌ An error occurred during the seeding process:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();