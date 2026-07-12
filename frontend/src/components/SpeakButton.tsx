/**
 * SpeakButton.tsx
 *
 * Fetches TTS audio from the backend and plays it when clicked.
 *
 * Props:
 *   text    — the text to speak
 *   lang    — ISO 639-1 language code (default 'en')
 *   size    — icon size variant: 'sm' | 'md' (default 'sm')
 */

import React, { useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { synthesizeSpeech } from '../services/api';

interface SpeakButtonProps {
  text: string;
  lang?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SpeakButton: React.FC<SpeakButtonProps> = ({ text, lang = 'en', size = 'sm', className = '' }) => {
  const [status, setStatus]     = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioRef                 = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef             = useRef<string | null>(null);

  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const btnSize  = size === 'md' ? 'w-9 h-9'  : 'w-7 h-7';

  const handleClick = useCallback(async () => {
    // If currently playing, stop it
    if (status === 'playing' && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setStatus('idle');
      return;
    }

    setStatus('loading');
    try {
      // Revoke previous object URL to avoid memory leaks
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const objectUrl       = await synthesizeSpeech(text, lang);
      objectUrlRef.current  = objectUrl;

      const audio = new Audio(objectUrl);
      audioRef.current = audio;

      audio.onended = () => setStatus('idle');
      audio.onerror = () => setStatus('error');

      setStatus('playing');
      await audio.play();
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [text, lang, status]);

  return (
    <button
      type="button"
      onClick={handleClick}
      title={status === 'playing' ? 'Stop' : 'Listen'}
      className={`
        ${btnSize} rounded-full flex items-center justify-center
        border border-gray-200 dark:border-gray-700
        text-gray-500 dark:text-gray-400
        hover:bg-primary-50 dark:hover:bg-primary-900/20
        hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400
        transition-colors
        ${status === 'error' ? 'border-red-300 text-red-400' : ''}
        ${className}
      `}
    >
      {status === 'loading'
        ? <Loader2 className={`${iconSize} animate-spin`} />
        : status === 'playing'
        ? <VolumeX className={iconSize} />
        : <Volume2 className={iconSize} />}
    </button>
  );
};

export default SpeakButton;
