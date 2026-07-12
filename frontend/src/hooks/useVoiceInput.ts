/**
 * useVoiceInput.ts — React hook for microphone recording + Watson STT transcription.
 *
 * Usage:
 *   const { recording, transcript, start, stop, clear, error } = useVoiceInput();
 */

import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/api';

export type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';

export interface UseVoiceInputResult {
  state: VoiceInputState;
  transcript: string;
  error: string;
  start: () => Promise<void>;
  stop: () => void;
  clear: () => void;
}

export function useVoiceInput(): UseVoiceInputResult {
  const [state, setState]           = useState<VoiceInputState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError]           = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);

  const start = useCallback(async () => {
    setError('');
    setTranscript('');
    setState('recording');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Prefer webm/opus if supported; fall back to default
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        // Stop all tracks to release the microphone indicator
        stream.getTracks().forEach((t) => t.stop());

        setState('transcribing');
        try {
          const blob       = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
          const text       = await transcribeAudio(blob);
          setTranscript(text || '');
          setState('done');
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Transcription failed';
          setError(msg);
          setState('error');
        }
      };

      mr.start(250); // collect data every 250 ms
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(msg);
      setState('error');
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const clear = useCallback(() => {
    setTranscript('');
    setError('');
    setState('idle');
    chunksRef.current = [];
  }, []);

  return { state, transcript, error, start, stop, clear };
}
