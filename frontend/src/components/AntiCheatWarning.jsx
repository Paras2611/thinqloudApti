import React from 'react';
import { AlertOctagon, ShieldAlert, EyeOff } from 'lucide-react';

export default function AntiCheatWarning({ switchCount, isOpen, onClose }) {
  if (!isOpen) return null;

  const isSevere = switchCount >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl backdrop-blur-md transition-all ${
        isSevere
          ? 'bg-rose-950/90 border-rose-500/60 shadow-rose-500/20'
          : 'bg-amber-950/90 border-amber-500/60 shadow-amber-500/20'
      }`}>
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-3 rounded-xl ${isSevere ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {isSevere ? <AlertOctagon className="w-6 h-6 animate-bounce" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isSevere ? 'text-rose-200' : 'text-amber-200'}`}>
              {isSevere ? 'Security Violation Warning!' : 'Tab Switch Detected'}
            </h3>
            <p className="text-xs text-slate-300">Campus Assessment Proctor Watchdog</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-200 mb-6">
          <p>
            You navigated away from the assessment window. This event has been recorded in the session audit log with an immutable timestamp.
          </p>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between font-mono">
            <span className="text-slate-400 text-xs">Total Tab Switches Recorded:</span>
            <span className={`text-base font-bold ${isSevere ? 'text-rose-400' : 'text-amber-400'}`}>
              {switchCount} / 3 Allowed
            </span>
          </div>
          {isSevere && (
            <p className="text-xs text-rose-300 font-medium">
              ⚠️ Warning: You have reached or exceeded the threshold of 3 window switches. Continued defocusing may lead to immediate disqualification by the placement coordinator.
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
            isSevere
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
          }`}
        >
          I Understand & Return to Test
        </button>
      </div>
    </div>
  );
}
