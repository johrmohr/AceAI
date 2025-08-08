/* App.js */
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  // --- Deployment configuration (env-driven) ---
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
  const WS_URL = (() => {
    if (process.env.REACT_APP_WS_URL) return process.env.REACT_APP_WS_URL;
    if (API_BASE_URL) {
      try { return API_BASE_URL.replace(/^http/i, 'ws'); } catch (_) {}
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}`;
  })();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [dialogue, setDialogue] = useState([]);
  const [currentDialogue, setCurrentDialogue] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewPaused, setIsInterviewPaused] = useState(false);
  const [isFetchingHint, setIsFetchingHint] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [timer, setTimer] = useState(1800);
  const [editorHeight, setEditorHeight] = useState(300);

  const [hints, setHints] = useState([]);
  const [liveFeedback, setLiveFeedback] = useState('');
  const [transcript, setTranscript] = useState('');
  const [showFinalFeedback, setShowFinalFeedback] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState(null);
  const [isFetchingFinalFeedback, setIsFetchingFinalFeedback] = useState(false);
  const [allProblems, setAllProblems] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState('random');
  const measureRef = useRef(null);
  const [problemSelectWidth, setProblemSelectWidth] = useState(null);
  const mediaStreamRef = useRef(null);
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const feedbackIntervalRef = useRef(null);

  const dialogues = [
    "Welcome to your mock interview! We're going to start with a coding challenge.",
    "The problem is now visible on your screen. Please read it carefully, and then explain your thought process as you work through the solution.",
    "Remember to think out loud. It helps me understand how you approach problem-solving.",
    "You're about halfway through your allotted time. How are you feeling about your progress?",
    "You have about five minutes left. Is there anything you'd like to wrap up or finalize?",
    "Time is up. Let's discuss your solution."
  ];

  const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatProblemDescription = (rawDescription) => {
    const escaped = escapeHtml(rawDescription || '');

    // Highlight common variable tokens as inline code badges
    const codeTokens = ['nums', 'n', 'k'];
    let html = escaped;
    codeTokens.forEach((token) => {
      const tokenRegex = new RegExp(`\\b${token}\\b`, 'g');
      html = html.replace(tokenRegex, `<code class="inline-token">${token}</code>`);
    });

    // Create paragraphs only on blank lines. Avoid inserting <br/> for single newlines
    const paragraphs = html.trim().split(/\n\s*\n/);
    return paragraphs.map(p => `<p>${p}</p>`).join('');
  };

  const formatExampleValue = (value) => {
    try {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);

      // Pretty-print objects like { nums: [2,7], target: 9 }
      if (Array.isArray(value)) {
        return `[${value.map((v) => formatExampleValue(v)).join(', ')}]`;
      }
      if (typeof value === 'object') {
        // Render as key = value pairs
        const parts = Object.entries(value).map(([k, v]) => {
          const rendered = Array.isArray(v)
            ? `[${v.map((x) => (typeof x === 'string' ? `'${x}'` : String(x))).join(', ')}]`
            : typeof v === 'string'
              ? `'${v}'`
              : String(v);
          return `${k} = ${rendered}`;
        });
        return parts.join(', ');
      }
      return JSON.stringify(value);
    } catch (_) {
      return String(value);
    }
  };

  const formatConstraintText = (text) => {
    let html = escapeHtml(text || '');
    const tokens = ['nums.length', 'nums[i]', 'nums', 'target'];
    tokens.forEach((t) => {
      const safe = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(safe, 'g'), `<code class="inline-token">${t}</code>`);
    });
    html = html.replace(/10\^\d+/g, (m) => `<code class="inline-token">${m}</code>`);
    return html;
  };

  useEffect(() => {
    if (isInterviewStarted) {
      setCurrentDialogue(dialogues[0]);
    }
  }, [isInterviewStarted]);

  useEffect(() => {
    if (!isInterviewStarted || isInterviewPaused) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          handleStopInterview();
          setCurrentDialogue(dialogues[5]);
          return 0;
        }

        if (newTime === 15 * 60) {
          setCurrentDialogue(dialogues[3]);
        } else if (newTime === 5 * 60) {
          setCurrentDialogue(dialogues[4]);
        } else if (newTime === 29 * 60 + 55) {
          setCurrentDialogue(dialogues[1]);
        } else if (newTime === 29 * 60) {
          setCurrentDialogue(dialogues[2]);
        }


        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isInterviewStarted, isInterviewPaused]);



  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
  ];

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/problems`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const problems = await response.json();
        setAllProblems(problems);
        if (problems.length > 0) {
          const randomProblem = problems[Math.floor(Math.random() * problems.length)];
          setProblem(randomProblem);
          setCode(randomProblem.starter_code.python || '');
          setSelectedProblemId('random');
        } else {
          setError('No problems available.');
        }
      } catch (e) {
        console.error('Error fetching problem list:', e);
        setError('Could not connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProblems();
  }, []);

  const applyProblemSelection = (value) => {
    if (!allProblems || allProblems.length === 0) return;
    if (value === 'random') {
      const randomProblem = allProblems[Math.floor(Math.random() * allProblems.length)];
      setProblem(randomProblem);
      setCode(randomProblem.starter_code[language] || '');
      return;
    }
    const found = allProblems.find(p => p.problem_id === value);
    if (found) {
      setProblem(found);
      setCode(found.starter_code[language] || '');
    }
  };

  const handleProblemSelectionChange = (e) => {
    const value = e.target.value;
    setSelectedProblemId(value);
    applyProblemSelection(value);
  };

  const getProblemLabel = (p) => `${p.title} (${p.difficulty.toLowerCase()})`;
  const selectedProblemLabel = selectedProblemId === 'random'
    ? 'Random'
    : (allProblems.find(p => p.problem_id === selectedProblemId) ? getProblemLabel(allProblems.find(p => p.problem_id === selectedProblemId)) : 'Random');

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    // Update measure content and compute width with padding for arrow
    measureRef.current.textContent = selectedProblemLabel;
    const measured = measureRef.current.offsetWidth;
    const paddingForArrow = 28; // approximate padding + arrow width
    setProblemSelectWidth(measured + paddingForArrow);
  }, [selectedProblemLabel, isLoading]);

  const fetchAIFeedback = async () => {
    if (!problem || isFetchingHint) return;
    setIsFetchingHint(true);
    try {
      const currentCode = code;
      const currentTranscript = transcript;

      console.log("Fetching AI feedback with data:", {
        code: currentCode,
        transcript: currentTranscript,
        problemId: problem.problem_id,
      });

      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
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
      setHints(prev => [...prev, feedback]);
    } catch (error) {
      console.error("Error fetching AI feedback:", error);
    } finally {
      setIsFetchingHint(false);
    }
  };




  const fetchFinalFeedback = async () => {
    if (!problem || isFetchingFinalFeedback) return;
    setIsFetchingFinalFeedback(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback/final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          transcript,
          problemId: problem.problem_id,
          validationSummary: validationResults?.summary || null,
          validationResults: validationResults?.results || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch final feedback');
      setFinalFeedback(data.feedback || null);
      setShowFinalFeedback(true);
    } catch (err) {
      console.error('Error fetching final feedback:', err);
      setFinalFeedback({
        summary: 'Could not generate final feedback at this time.',
        strengths: [],
        areas_for_improvement: [],
        next_steps: [],
      });
      setShowFinalFeedback(true);
    } finally {
      setIsFetchingFinalFeedback(false);
    }
  };

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
      const response = await fetch(`${API_BASE_URL}/api/problems/${problem.problem_id}/validate`, {
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

            const ws = new WebSocket(WS_URL);
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

    const handleStopInterview = async () => {
        if (recorderRef.current) {
            recorderRef.current.stopRecording(() => {
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => track.stop());
                }
            });
        }
        wsRef.current?.close();
        setIsInterviewStarted(false);

        // Show full-screen loading overlay while generating final feedback
        setIsFetchingFinalFeedback(true);

        // Fetch final feedback before clearing transcript
        await fetchFinalFeedback();

        // Keep transcript available for the final page; clear only after if desired
        // setTranscript('');
    };

    const handleEndInterviewClick = () => {
        setShowEndConfirmation(true);
    };

    const handleConfirmEnd = () => {
        handleStopInterview();
        setShowEndConfirmation(false);
    };

    const handleCancelEnd = () => {
        setShowEndConfirmation(false);
    };

  if (isLoading) return <div className="status-message">Loading...</div>;
  if (error && !isInterviewStarted) return <div className="status-message error">{error}</div>;
  if (!problem) return <div className="status-message">No problem loaded.</div>;

  // Global loading overlay that blurs the background while fetching final feedback
  const LoadingOverlay = () => (
    <div className="loading-overlay">
      <div className="loading-box">
        <div style={{ marginBottom: '0.75rem' }}>
          <div className="loader" />
        </div>
        <div>Generating your final feedback...</div>
      </div>
    </div>
  );

  if (isFetchingFinalFeedback && !showFinalFeedback) {
    // Show overlay over the interview UI while we prepare the final feedback page
    return (
      <>
        <div className="app-container blurred">
          {/* Keep current UI structure in background but blurred */}
        </div>
        <LoadingOverlay />
      </>
    );
  }

  if (showFinalFeedback) {
    const ff = finalFeedback || {};
    return (
      <div className="final-feedback-page">
        <div className="final-feedback-header">
          <h2>Interview Feedback</h2>
        </div>
        <div className="final-feedback-main">
          <div className="examples-section">
            <div className="example">
              <div className="example-header">Strengths</div>
              <div className="example-block">
                {(ff.strengths || []).length === 0 ? (
                  <div className="example-row">No strengths captured.</div>
                ) : (
                  (ff.strengths || []).map((s, i) => (
                    <div key={i} className="example-row">• {s}</div>
                  ))
                )}
              </div>
            </div>
            <div className="example">
              <div className="example-header">Areas for Improvement</div>
              <div className="example-block">
                {(ff.areas_for_improvement || []).length === 0 ? (
                  <div className="example-row">No areas captured.</div>
                ) : (
                  (ff.areas_for_improvement || []).map((s, i) => (
                    <div key={i} className="example-row">• {s}</div>
                  ))
                )}
              </div>
            </div>
            <div className="example">
              <div className="example-header">Next Steps</div>
              <div className="example-block">
                {(ff.next_steps || []).length === 0 ? (
                  <div className="example-row">No next steps captured.</div>
                ) : (
                  (ff.next_steps || []).map((s, i) => (
                    <div key={i} className="example-row">• {s}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="editor-controls" style={{ borderTop: 'none' }}>
          <button className="interview-button" onClick={() => {
            setShowFinalFeedback(false);
            setValidationResults(null);
            setHints([]);
            setTranscript('');
            setIsInterviewStarted(false);
          }}>Interview Again</button>
        </div>
      </div>
    );
  }

  const isScreenBlurred = !isInterviewStarted || isInterviewPaused;

  return (
    <>
      {!isInterviewStarted && (
        <div className="interview-start-overlay">
          <div className="interview-start-box">
            <h1>Ready for your interview?</h1>
            <div style={{ margin: '0.75rem 0 1rem' }}>
              <label htmlFor="problem-select" style={{ marginRight: '0.5rem' }}>Coding Problem:</label>
              <span className="select-measure" ref={measureRef}></span>
              <select
                id="problem-select"
                value={selectedProblemId}
                onChange={handleProblemSelectionChange}
                style={problemSelectWidth ? { width: problemSelectWidth } : undefined}
              >
                <option value="random">Random</option>
                {allProblems
                  .slice()
                  .sort((a, b) => {
                    const order = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };
                    return (order[a.difficulty] ?? 99) - (order[b.difficulty] ?? 99);
                  })
                  .map(p => (
                    <option key={p.problem_id} value={p.problem_id}>
                      {getProblemLabel(p)}
                    </option>
                  ))}
              </select>
            </div>
            <button onClick={handleStartInterview} className="interview-button">Start Interview</button>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      )}

      {isInterviewPaused && (
        <div className="interview-resume-overlay">
          <div className="interview-resume-box">
            <button onClick={handleResumeInterview} className="interview-button">Resume</button>
          </div>
        </div>
      )}

      {showEndConfirmation && (
        <div className="interview-resume-overlay">
          <div className="interview-resume-box">
            <h2>Are you sure you want to end the interview?</h2>
            <div className="dialogue-buttons">
              <button onClick={handleConfirmEnd} className="interview-button">Yes</button>
              <button onClick={handleCancelEnd} className="interview-button">No</button>
            </div>
          </div>
        </div>
      )}

      <div className={`app-container ${isScreenBlurred ? 'blurred' : ''}`}>

        <div className="left-panel">
          <div className="dialogue-module">
            <h2>Interviewer Dialogue 🎙️</h2>

            <div className="dialogue-content">
              <p>{currentDialogue}</p>
            </div>
            <div className="dialogue-buttons">
              {isInterviewStarted && !isInterviewPaused && (
                <button onClick={handlePauseInterview} className="interview-button">Pause</button>
              )}
              {isInterviewStarted && (
                  <button onClick={handleEndInterviewClick} className="interview-button">End Interview</button>
              )}
            </div>
          </div>
          <div className="feedback-module">
            <h2>Hints 💡</h2>
            <div className="feedback-content">
              {hints.map((hint, index) => (
                <p key={index}>{hint}</p>
              ))}
            </div>
            <button onClick={fetchAIFeedback} className="interview-button" disabled={isFetchingHint}>
              {isFetchingHint ? <div className="loader" /> : 'Get a hint'}
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="problem-area">
            <div className="problem-header">
              <div className="problem-title">
                <h2>{problem.title}</h2>
                <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
              </div>
              <div className="timer-display">
                {`${Math.floor(timer / 60).toString().padStart(2, '0')}:${(timer % 60).toString().padStart(2, '0')}`}
              </div>
            </div>
            <div
              className="problem-description"
              dangerouslySetInnerHTML={{ __html: formatProblemDescription(problem.description) }}
            />

            <div className="examples-section">
              {problem.examples.map((example, index) => (
                <div key={index} className="example">
                  <div className="example-header">Example {index + 1}:</div>
                  <div className="example-block">
                    <div className="example-row">
                      <span className="example-label">Input:</span>
                      <code className="inline-code">{formatExampleValue(example.input)}</code>
                    </div>
                    <div className="example-row">
                      <span className="example-label">Output:</span>
                      <code className="inline-code">{formatExampleValue(example.output)}</code>
                    </div>
                    {example.explanation && (
                      <div className="example-row">
                        <span className="example-label">Explanation:</span>
                        <span>{example.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <h3 className="constraints-title">Constraints:</h3>
            <ul className="constraints-list">
              {problem.constraints.map((constraint, index) => (
                <li key={index} dangerouslySetInnerHTML={{ __html: formatConstraintText(constraint) }} />
              ))}
            </ul>
          </div>
          <div className="editor-area">
            <div className="editor-controls">
              <label htmlFor="language-select">Language:</label>
              <select id="language-select" value={language} onChange={handleLanguageChange}>
                {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button onClick={handleSubmit} disabled={isRunning} className="interview-button">
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
            <div className="editor-wrapper">
              <Editor
                height={editorHeight}
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                onMount={(editor, monaco) => {
                  const computeHeight = () => {
                    try {
                      // Try Monaco API for content height; fallback to line count * lineHeight
                      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight) || 18;
                      const model = editor.getModel();
                      const lineCount = model ? model.getLineCount() : 1;
                      let contentHeight = lineCount * lineHeight + 20; // padding
                      // Clamp to avoid runaway height
                      contentHeight = Math.max(200, Math.min(contentHeight, 2000));
                      setEditorHeight(contentHeight);
                      const width = editor.getLayoutInfo().width;
                      editor.layout({ width, height: contentHeight });
                    } catch (_) {}
                  };
                  editor.onDidContentSizeChange(computeHeight);
                  computeHeight();
                }}
                options={{
                  automaticLayout: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  // Hide internal scrollbars and allow parent to scroll
                  scrollbar: { vertical: 'hidden', horizontal: 'hidden', handleMouseWheel: false },
                  overviewRulerLanes: 0,
                }}
              />
            </div>
            <ResultsDisplay validationResults={validationResults} />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
