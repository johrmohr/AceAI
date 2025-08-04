/* App.js */
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';

// --- Helper Component for Displaying Results ---
// This component remains unchanged.
const ResultsDisplay = ({ validationResults }) => {
  if (!validationResults) {
    return null;
  }
  const { summary, results } = validationResults;
  const isSuccess = summary.passed === summary.total;
  return (
    <div className="output-container">
      <h3>Test Results:</h3>
      <div className={`summary-header ${isSuccess ? 'success' : 'fail'}`}>
        <h4>
          {isSuccess ? '✅ Accepted' : '❌ Wrong Answer'}
        </h4>
        <p>{summary.passed} / {summary.total} test cases passed.</p>
      </div>
      <div className="test-results">
        {results.map((result) => (
          <div key={result.test_id} className={`test-result ${result.passed ? 'pass' : 'fail'}`}>
            <div className="test-result-header">
              <strong>Test Case {result.test_id}:</strong>
              <span>{result.passed ? 'PASSED' : 'FAILED'}</span>
            </div>
            {!result.passed && (
              <div className="test-result-details">
                <p><strong>Input:</strong> <code>{JSON.stringify(result.input)}</code></p>
                <p><strong>Expected:</strong> <code>{JSON.stringify(result.expected)}</code></p>
                <p><strong>Got:</strong> <code>{JSON.stringify(result.actual)}</code></p>
                {result.error && <p className="error-message"><strong>Error:</strong> {result.error}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Main App Component ---
function App() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [dialogue, setDialogue] = useState("Welcome to your mock interview! Let's start with the first coding challenge. Take a look at the problem on your right, and I'll be here to provide feedback.");

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
  ];

  useEffect(() => {
    const fetchRandomProblem = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/problems');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allProblems = await response.json();
        if (allProblems.length > 0) {
          const randomProblem = allProblems[Math.floor(Math.random() * allProblems.length)];
          setProblem(randomProblem);
          setCode(randomProblem.starter_code.python || '');
        } else {
          setError('No problems are available in the database.');
        }
      } catch (e) {
        console.error('Error fetching problem:', e);
        setError('Could not connect to the server. Please ensure it is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomProblem();
  }, []);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    if (problem && problem.starter_code[newLanguage]) {
      setCode(problem.starter_code[newLanguage]);
    }
    setValidationResults(null);
  };

  const handleSubmit = async () => {
    if (!problem || isRunning) return;
    setIsRunning(true);
    setValidationResults(null);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5001/api/problems/${problem.problem_id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Validation failed with status: ${response.status}`);
      }
      const resultData = await response.json();
      setValidationResults(resultData);
    } catch (e) {
      console.error('Error submitting solution:', e);
      setError('An error occurred while submitting your solution.');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) return <div className="status-message">Loading...</div>;
  if (error) return <div className="status-message error">{error}</div>;
  if (!problem) return <div className="status-message">No problem loaded.</div>;

  return (
    <div className="app-container">
      {/* Left Panel (30%) */}
      <div className="left-panel">
        <div className="dialogue-module">
          <h2>Interviewer Dialogue 🎙️</h2>
          <div className="dialogue-content">
            <p>{dialogue}</p>
          </div>
        </div>
        <div className="feedback-module">
          <h2>Live Feedback 💡</h2>
          <div className="feedback-content">
            <p>Your feedback will appear here as you code...</p>
          </div>
        </div>
      </div>

      {/* Right Panel (70%) - Single Scrollable Module */}
      <div className="right-panel">
        {/* Problem Description */}
        <div className="problem-header">
            <h2>{problem.title}</h2>
            <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty}
            </span>
        </div>
        <p>{problem.description}</p>
        <h3>Examples:</h3>
        {problem.examples.map((example, index) => (
            <div key={index} className="example">
            <strong>Example {index + 1}:</strong>
            <pre>
                <strong>Input:</strong> {JSON.stringify(example.input)}\n
                <strong>Output:</strong> {JSON.stringify(example.output)}
            </pre>
            </div>
        ))}
        <h3>Constraints:</h3>
        <ul>
            {problem.constraints.map((constraint, index) => (
            <li key={index}>{constraint}</li>
            ))}
        </ul>

        {/* Editor and Results */}
        <div className="editor-controls">
            <label htmlFor="language-select">Language:</label>
            <select id="language-select" value={language} onChange={handleLanguageChange}>
            {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
            <button onClick={handleSubmit} disabled={isRunning} className="run-button">
            {isRunning ? 'Running...' : 'Run Code'}
            </button>
        </div>
        <div className="editor-wrapper">
            <Editor
                height="400px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  automaticLayout: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                }}
            />
        </div>
        <ResultsDisplay validationResults={validationResults} />
      </div>
    </div>
  );
}

export default App;
