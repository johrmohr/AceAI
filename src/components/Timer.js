import React from 'react';

const Timer = ({ seconds }) => {
  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <div className="timer-display">{formatTime()}</div>
    </div>
  );
};

export default Timer;
