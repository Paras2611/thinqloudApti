import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function Timer({ initialSeconds, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpireRef.current) {
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formatTime = () => {
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Color logic according to PRD CI-001:
  // Red at <= 5 mins (300s)
  // Amber at <= 10 mins (600s)
  // Emerald / Indigo default
  let colorClasses = 'bg-slate-900/90 text-emerald-400 border-emerald-500/30';
  let isFlashing = false;

  if (secondsLeft <= 300) {
    colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20';
    isFlashing = true;
  } else if (secondsLeft <= 600) {
    colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20';
  }

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border font-mono font-bold text-sm tracking-wider backdrop-blur-md transition-all ${colorClasses} ${isFlashing ? 'animate-pulse' : ''}`}
      title="Remaining Test Time"
    >
      {secondsLeft <= 300 ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-current" />
      )}
      <span>{formatTime()}</span>
    </div>
  );
}
