'use client';

import { useEffect } from 'react';

interface VoiceModeMinimalProps {
  isActive: boolean;
  onClose: () => void;
  isSpeaking: boolean;
  isListening: boolean;
}

export default function VoiceModeMinimal({
  isActive,
  onClose,
  isSpeaking,
  isListening,
}: VoiceModeMinimalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        onClose();
      }
    };

    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      {/* Microphone Icon - Click anywhere to exit */}
      <div className="relative">
        {/* Animated glow rings when active */}
        {(isSpeaking || isListening) && (
          <>
            <div className="absolute inset-[-20px] rounded-full bg-white/10 animate-ping"></div>
            <div className="absolute inset-[-10px] rounded-full bg-white/5 animate-pulse"></div>
          </>
        )}

        {/* Microphone SVG */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`relative z-10 transition-colors duration-300 ${
            isListening
              ? 'text-green-400'
              : isSpeaking
              ? 'text-blue-400'
              : 'text-white/80'
          }`}
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="22"></line>
        </svg>
      </div>
    </div>
  );
}