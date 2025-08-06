/* App.js */
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './App.css';
import RecordRTC from 'recordrtc';

// --- Helper Component for Displaying Results ---
const ResultsDisplay = ({ validationResults }) => {
  if (!validationResults) return null;
  const { summary, results } = validationResults;
  const isSuccess = summary.passed === summary.total;
  return (
    <div className="output-container">
      <h3>Test Results:</h3>
      <div className={`summary-header ${isSuccess ? 'success' : 'fail'}`}>
        <h4>{isSuccess ? '✅ Accepted' : '❌ Wrong Answer'}</h4>
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
  const [dialogue, setDialogue] = useState("Welcome to your mock interview! Let's start with the first coding challenge.");
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewPaused, setIsInterviewPaused] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState('');
  const [transcript, setTranscript] = useState('');
  const mediaStreamRef = useRef(null);
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const feedbackIntervalRef = useRef(null);

  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
  ];

  useEffect(() => {
    const fetchRandomProblem = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/problems');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allProblems = await response.json();
        if (allProblems.length > 0) {
          const randomProblem = allProblems[Math.floor(Math.random() * allProblems.length)];
          setProblem(randomProblem);
          setCode(randomProblem.starter_code.python || '');
        } else {
          setError('No problems available.');
        }
      } catch (e) {
        console.error('Error fetching problem:', e);
        setError('Could not connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRandomProblem();
  }, []);

  const fetchAIFeedback = async () => {
    if (!problem) {
      console.log("Skipping feedback: problem not loaded yet.");
      return;
    }
    const currentCode = code;
    const currentTranscript = transcript;

    console.log("Fetching AI feedback with data:", {
      code: currentCode,
      transcript: currentTranscript,
      problemId: problem.problem_id,
    });

    try {
        const response = await fetch('http://localhost:5001/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: currentCode,
                transcript: currentTranscript,
                problemId: problem.problem_id,
            }),
        });
        
        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to fetch AI feedback.');
        }

        console.log("Received data from feedback API:", responseData);
        const { feedback } = responseData;
        setLiveFeedback(feedback);

    } catch (error) {
        console.error("Error fetching AI feedback:", error);
    }
  };

  useEffect(() => {
    if (isInterviewStarted && !isInterviewPaused) {
      feedbackIntervalRef.current = setInterval(fetchAIFeedback, 15000);
    } else {
      clearInterval(feedbackIntervalRef.current);
    }

    return () => {
      clearInterval(feedbackIntervalRef.current);
    };
  }, [isInterviewStarted, isInterviewPaused]);


  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    if (problem?.starter_code[newLanguage]) {
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
        throw new Error(errorData.message || `Validation failed`);
      }
      const resultData = await response.json();
      setValidationResults(resultData);
    } catch (e) {
      console.error('Error submitting solution:', e);
      setError('An error occurred while submitting.');
    } finally {
      setIsRunning(false);
    }
  };

    const handleStartInterview = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const ws = new WebSocket('ws://localhost:5001');
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('WebSocket connection opened');

                const recorder = new RecordRTC(stream, {
                    type: 'audio',
                    mimeType: 'audio/wav',
                    recorderType: RecordRTC.StereoAudioRecorder,
                    timeSlice: 250, // Send data every 250ms
                    desiredSampRate: 16000,
                    numberOfAudioChannels: 1,
                    ondataavailable: (blob) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(blob);
                        }
                    },
                });

                recorder.startRecording();
                recorderRef.current = recorder;
            };

            ws.onclose = () => console.log('WebSocket connection closed');
            ws.onerror = (error) => console.error('WebSocket error:', error);

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === 'transcript') {
                    setTranscript(prev => prev + message.data + ' ');
                }
            };

            setIsInterviewStarted(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Microphone access denied. Please check browser permissions.");
        }
    };

    const handlePauseInterview = () => {
        if (recorderRef.current) {
            recorderRef.current.pauseRecording();
        }
        setIsInterviewPaused(true);
    };

    const handleResumeInterview = () => {
        if (recorderRef.current) {
            recorderRef.current.resumeRecording();
        }
        setIsInterviewPaused(false);
    };

    const handleStopInterview = () => {
        if (recorderRef.current) {
            recorderRef.current.stopRecording(() => {
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                }
            });
        }
        wsRef.current?.close();
        setIsInterviewStarted(false);
        setTranscript('');
    };

  if (isLoading) return <div className="status-message">Loading...</div>;
  if (error && !isInterviewStarted) return <div className="status-message error">{error}</div>;
  if (!problem) return <div className="status-message">No problem loaded.</div>;

  const isScreenBlurred = !isInterviewStarted || isInterviewPaused;

  return (
    <>
      {!isInterviewStarted && (
        <div className="interview-start-overlay">
          <div className="interview-start-box">
            <h1>Ready for your interview?</h1>
            <p>Click the button below to begin.</p>
            <button onClick={handleStartInterview} className="start-interview-button">Start Interview</button>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      )}

      {isInterviewPaused && (
        <div className="interview-resume-overlay">
          <div className="interview-resume-box">
            <button onClick={handleResumeInterview} className="resume-interview-button">Resume</button>
          </div>
        </div>
      )}

      <div className={`app-container ${isScreenBlurred ? 'blurred' : ''}`}>
        <div className="left-panel">
          <div className="dialogue-module">
            <h2>Interviewer Dialogue 🎙️</h2>
            <div className="dialogue-content">
              <p>{dialogue}</p>
            </div>
            {isInterviewStarted && !isInterviewPaused && (
              <button onClick={handlePauseInterview} className="pause-interview-button">Pause</button>
            )}
            {isInterviewStarted && (
                <button onClick={handleStopInterview} className="stop-interview-button">End Interview</button>
            )}
          </div>
          <div className="transcript-module">
            <h2>Your Thoughts 🎤</h2>
            <div className="transcript-content">
              <p>{transcript}</p>
            </div>
          </div>
          <div className="feedback-module">
            <h2>Live Feedback 💡</h2>
            <div className="feedback-content">
              <p>{liveFeedback}</p>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="problem-header">
            <h2>{problem.title}</h2>
            <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
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
            {problem.constraints.map((constraint, index) => <li key={index}>{constraint}</li>)}
          </ul>
          <div className="editor-controls">
            <label htmlFor="language-select">Language:</label>
            <select id="language-select" value={language} onChange={handleLanguageChange}>
              {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
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
                scrollbar: { alwaysConsumeMouseWheel: false },
              }}
            />
          </div>
          <ResultsDisplay validationResults={validationResults} />
        </div>
      </div>
    </>
  );
}

export default App;
