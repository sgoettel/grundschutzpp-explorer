import React from 'react';

interface ProgressProps {
  label: string;
  percent?: number;
}

const Progress: React.FC<ProgressProps> = ({ label, percent = 30 }) => (
  <div className="progress" role="status" aria-live="polite">
    <div className="progress-bar" aria-hidden>
      <span style={{ width: `${percent}%` }} />
    </div>
    <div>{label}</div>
  </div>
);

export default Progress;
