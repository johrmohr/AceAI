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
    entry_method: "twoSum",
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
    entry_method: "isPalindrome",
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
  },
  {
    problem_id: "valid-anagram",
    title: "Valid Anagram",
    difficulty: "Easy",
    description: "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
    examples: [
      { input: { s: "anagram", t: "nagaram" }, output: true },
      { input: { s: "rat", t: "car" }, output: false }
    ],
    constraints: [
      "1 <= s.length, t.length <= 5 * 10^4",
      "s and t consist of lowercase English letters"
    ],
    entry_method: "isAnagram",
    starter_code: {
      javascript: `var isAnagram = function(s, t) {\n    \n};`,
      python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        pass`
    },
    hidden_test_cases: [
      { input: { s: "", t: "" }, output: true },
      { input: { s: "a", t: "a" }, output: true },
      { input: { s: "a", t: "b" }, output: false }
    ]
  },
  {
    problem_id: "merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    difficulty: "Easy",
    description: "Merge two sorted arrays into one sorted array.",
    examples: [
      { input: { a: [1,2,4], b: [1,3,4] }, output: [1,1,2,3,4,4] },
      { input: { a: [], b: [] }, output: [] }
    ],
    constraints: [
      "0 <= a.length, b.length <= 10^4",
      "-10^9 <= a[i], b[i] <= 10^9"
    ],
    entry_method: "mergeSorted",
    starter_code: {
      javascript: `var mergeSorted = function(a, b) {\n    \n};`,
      python: `class Solution:\n    def mergeSorted(self, a: list[int], b: list[int]) -> list[int]:\n        pass`
    },
    hidden_test_cases: [
      { input: { a: [1,3,5], b: [2,4,6] }, output: [1,2,3,4,5,6] },
      { input: { a: [0,0,0], b: [0,0] }, output: [0,0,0,0,0] },
      { input: { a: [5], b: [] }, output: [5] }
    ]
  },
  {
    problem_id: "binary-search",
    title: "Binary Search",
    difficulty: "Easy",
    description: "Given a sorted array of integers nums and an integer target, return the index of target in nums, or -1 if it does not exist.",
    examples: [
      { input: { nums: [-1,0,3,5,9,12], target: 9 }, output: 4 },
      { input: { nums: [-1,0,3,5,9,12], target: 2 }, output: -1 }
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^9 <= nums[i], target <= 10^9",
      "nums is strictly increasing"
    ],
    entry_method: "search",
    starter_code: {
      javascript: `var search = function(nums, target) {\n    \n};`,
      python: `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass`
    },
    hidden_test_cases: [
      { input: { nums: [5], target: 5 }, output: 0 },
      { input: { nums: [5], target: -5 }, output: -1 },
      { input: { nums: [1,2,3,4,5,6,7,8], target: 8 }, output: 7 }
    ]
  },
  {
    problem_id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: { s: "()" }, output: true },
      { input: { s: "()[]{}" }, output: true },
      { input: { s: "(]" }, output: false }
    ],
    constraints: ["1 <= s.length <= 10^4"],
    entry_method: "isValid",
    starter_code: {
      javascript: `var isValid = function(s) {\n    \n};`,
      python: `class Solution:\n    def isValid(self, s: str) -> bool:\n        pass`
    },
    hidden_test_cases: [
      { input: { s: "{[]}" }, output: true },
      { input: { s: "([)]" }, output: false },
      { input: { s: "" }, output: true }
    ]
  },
  {
    problem_id: "top-k-frequent-elements",
    title: "Top K Frequent Elements",
    difficulty: "Medium",
    description: "Given an integer array nums and an integer k, return the k most frequent elements in any order.",
    examples: [
      { input: { nums: [1,1,1,2,2,3], k: 2 }, output: [1,2] },
      { input: { nums: [1], k: 1 }, output: [1] }
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "k is in the range [1, the number of unique elements in nums]"
    ],
    entry_method: "topKFrequent",
    starter_code: {
      javascript: `var topKFrequent = function(nums, k) {\n    \n};`,
      python: `class Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        pass`
    },
    hidden_test_cases: [
      { input: { nums: [4,1,-1,2,-1,2,3], k: 2 }, output: [-1,2] },
      { input: { nums: [5,5,5,5], k: 1 }, output: [5] }
    ]
  },
  {
    problem_id: "climbing-stairs",
    title: "Climbing Stairs",
    difficulty: "Easy",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. Return the number of distinct ways to climb to the top.",
    examples: [
      { input: { n: 2 }, output: 2 },
      { input: { n: 3 }, output: 3 }
    ],
    constraints: [
      "1 <= n <= 45"
    ],
    entry_method: "climbStairs",
    starter_code: {
      javascript: `var climbStairs = function(n) {\n    \n};`,
      python: `class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass`
    },
    hidden_test_cases: [
      { input: { n: 1 }, output: 1 },
      { input: { n: 5 }, output: 8 },
      { input: { n: 10 }, output: 89 }
    ]
  },
  {
    problem_id: "longest-substring-without-repeating-characters",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    description: "Given a string s, find the length of the longest substring without repeating characters.",
    examples: [
      { input: { s: "abcabcbb" }, output: 3 },
      { input: { s: "bbbbb" }, output: 1 }
    ],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces"
    ],
    entry_method: "lengthOfLongestSubstring",
    starter_code: {
      javascript: `var lengthOfLongestSubstring = function(s) {\n    \n};`,
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass`
    },
    hidden_test_cases: [
      { input: { s: "pwwkew" }, output: 3 },
      { input: { s: "" }, output: 0 },
      { input: { s: "dvdf" }, output: 3 }
    ]
  },
  {
    problem_id: "word-ladder",
    title: "Word Ladder",
    difficulty: "Hard",
    description: "Given two words beginWord and endWord, and a dictionary wordList, return the length of the shortest transformation sequence from beginWord to endWord, such that only one letter can be changed at a time and each transformed word must exist in the word list. If no such sequence, return 0.",
    examples: [
      { input: { beginWord: "hit", endWord: "cog", wordList: ["hot","dot","dog","lot","log","cog"] }, output: 5 },
      { input: { beginWord: "hit", endWord: "cog", wordList: ["hot","dot","dog","lot","log"] }, output: 0 }
    ],
    constraints: [
      "1 <= beginWord.length <= 10",
      "endWord.length == beginWord.length",
      "1 <= wordList.length <= 5000",
      "beginWord, endWord, and wordList[i] consist of lowercase English letters"
    ],
    entry_method: "ladderLength",
    starter_code: {
      javascript: `var ladderLength = function(beginWord, endWord, wordList) {\n    \n};`,
      python: `class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:\n        pass`
    },
    hidden_test_cases: [
      { input: { beginWord: "a", endWord: "c", wordList: ["a","b","c"] }, output: 2 },
      { input: { beginWord: "hot", endWord: "dog", wordList: ["hot","dog"] }, output: 0 }
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