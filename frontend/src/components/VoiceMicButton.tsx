/**
 * VoiceMicButton.tsx
 *
 * A self-contained microphone button that records audio, sends it to the
 * Watson STT backend, and calls onTranscript(text) when done.
 *
 * Props:
 *   onTranscript  — called with the transcript string when recording completes
 *   disabled      — optional; disables the button when true
 *   className     — additional class names
 */

import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceMicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({ onTranscript, disabled, className = '' }) => {
  const { state, transcript, error, start, stop, clear } = useVoiceInput();

  // Keep a stable ref to onTranscript so the effect never re-runs due to
  // a new inline arrow function being passed from the parent on each render.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; });

  // Track whether we've already forwarded this particular transcript result
  // so a parent re-render can never trigger a second call.
  const firedRef = useRef(false);

  useEffect(() => {
    if (state === 'done' && transcript) {
      if (!firedRef.current) {
        firedRef.current = true;
        onTranscriptRef.current(transcript);
      }
      const t = setTimeout(() => {
        clear();
        firedRef.current = false;
      }, 500);
      return () => clearTimeout(t);
    }
    // Reset the guard whenever state leaves 'done'
    if (state !== 'done') {
      firedRef.current = false;
    }
  }, [state, transcript, clear]);

  const isRecording    = state === 'recording';
  const isTranscribing = state === 'transcribing';
  const isDisabled     = disabled || isTranscribing;

  const handleClick = () => {
    if (isRecording) {
      stop();
    } else {
      void start();
    }
  };

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        title={isRecording ? 'Stop recording' : 'Speak your answer'}
        className={`
          relative w-10 h-10 rounded-full flex items-center justify-center
          border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
          ${isRecording
            ? 'bg-red-500 border-red-600 text-white animate-pulse focus:ring-red-400'
            : isTranscribing
            ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 text-primary-500 cursor-wait focus:ring-primary-400'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 focus:ring-primary-400'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isTranscribing
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : isRecording
          ? <MicOff className="w-4 h-4" />
          : <Mic className="w-4 h-4" />}
      </button>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 max-w-[140px] text-center leading-tight">
          {error}
        </p>
      )}
    </div>
  );
};

export default VoiceMicButton;
