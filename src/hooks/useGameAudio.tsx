import { useEffect, useRef, useCallback } from 'react';

// Audio file configurations for different time limits
const countdownAudio: Record<number, string[]> = {
  10: [
    '/audio/A - 10 Second Count Down.mp3',
    '/audio/B - 10 Second Count Down.mp3',
  ],
  20: [
    '/audio/A - 20 Second Countdown.mp3',
    '/audio/B - 20 Second Countdown.mp3',
    '/audio/C - 20 Second Countdown.mp3',
  ],
  30: [
    '/audio/A - 30 Second Countdown.mp3',
    '/audio/B - 30 Second Countdown.mp3',
    '/audio/C - 30 Second Countdown.mp3',
  ],
  60: [
    '/audio/A - 60 Second Count Down.mp3',
    '/audio/B - 60 Second Count Down.mp3',
  ],
};

const LOBBY_MUSIC = '/audio/Lobby Music.mp3';

export const useGameAudio = () => {
  const lobbyAudioRef = useRef<HTMLAudioElement | null>(null);
  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioIndexRef = useRef<Record<number, number>>({
    10: 0,
    20: 0,
    30: 0,
    60: 0,
  });

  // Play lobby music (loops)
  const playLobbyMusic = useCallback(() => {
    if (!lobbyAudioRef.current) {
      lobbyAudioRef.current = new Audio(LOBBY_MUSIC);
      lobbyAudioRef.current.loop = true;
      lobbyAudioRef.current.volume = 0.5;
    }
    lobbyAudioRef.current.currentTime = 0;
    lobbyAudioRef.current.play().catch(console.error);
  }, []);

  // Stop lobby music
  const stopLobbyMusic = useCallback(() => {
    if (lobbyAudioRef.current) {
      lobbyAudioRef.current.pause();
      lobbyAudioRef.current.currentTime = 0;
    }
  }, []);

  // Get the next audio file for a time limit (iterates through options)
  const getNextCountdownAudio = useCallback((timeLimit: number): string => {
    const files = countdownAudio[timeLimit];
    if (!files || files.length === 0) {
      // Default to 30 second if no exact match
      const defaultFiles = countdownAudio[30];
      return defaultFiles[0];
    }

    const currentIndex = audioIndexRef.current[timeLimit] || 0;
    const file = files[currentIndex];
    
    // Increment index for next time (cycling through)
    audioIndexRef.current[timeLimit] = (currentIndex + 1) % files.length;
    
    return file;
  }, []);

  // Play countdown audio for a specific time limit
  const playCountdownAudio = useCallback((timeLimit: number) => {
    // Stop any existing countdown audio
    if (countdownAudioRef.current) {
      countdownAudioRef.current.pause();
    }

    const audioFile = getNextCountdownAudio(timeLimit);
    countdownAudioRef.current = new Audio(audioFile);
    countdownAudioRef.current.volume = 0.6;
    countdownAudioRef.current.play().catch(console.error);
  }, [getNextCountdownAudio]);

  // Stop countdown audio
  const stopCountdownAudio = useCallback(() => {
    if (countdownAudioRef.current) {
      countdownAudioRef.current.pause();
      countdownAudioRef.current.currentTime = 0;
    }
  }, []);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    stopLobbyMusic();
    stopCountdownAudio();
  }, [stopLobbyMusic, stopCountdownAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lobbyAudioRef.current) {
        lobbyAudioRef.current.pause();
        lobbyAudioRef.current = null;
      }
      if (countdownAudioRef.current) {
        countdownAudioRef.current.pause();
        countdownAudioRef.current = null;
      }
    };
  }, []);

  return {
    playLobbyMusic,
    stopLobbyMusic,
    playCountdownAudio,
    stopCountdownAudio,
    stopAllAudio,
  };
};
