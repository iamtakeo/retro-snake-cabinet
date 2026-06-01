import { useState, useEffect, useRef } from 'react';
import { Direction, GameStatus } from '../types';
import { sfx } from '../utils/audio';

interface UseKeyboardControlsProps {
  gameStatus: GameStatus;
  onDirectionChange: (dir: Direction) => void;
  onTogglePause: () => void;
  onStartGame: () => void;
  onReturnToMenu: () => void;
}

export function useKeyboardControls({
  gameStatus,
  onDirectionChange,
  onTogglePause,
  onStartGame,
  onReturnToMenu,
}: UseKeyboardControlsProps) {
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});

  // Keep references to prevent listener closure issues
  const statusRef = useRef<GameStatus>(gameStatus);
  const onDirectionChangeRef = useRef(onDirectionChange);
  const onTogglePauseRef = useRef(onTogglePause);
  const onStartGameRef = useRef(onStartGame);
  const onReturnToMenuRef = useRef(onReturnToMenu);

  useEffect(() => {
    statusRef.current = gameStatus;
    onDirectionChangeRef.current = onDirectionChange;
    onTogglePauseRef.current = onTogglePause;
    onStartGameRef.current = onStartGame;
    onReturnToMenuRef.current = onReturnToMenu;
  }, [gameStatus, onDirectionChange, onTogglePause, onStartGame, onReturnToMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default spatial scrolling on key navigation elements
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      setPressedKeys((prev) => ({
        ...prev,
        [e.key.toLowerCase()]: true,
        [e.key]: true,
      }));

      const activeStatus = statusRef.current;

      if (activeStatus === 'PLAYING') {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            onDirectionChangeRef.current('UP');
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            onDirectionChangeRef.current('DOWN');
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            onDirectionChangeRef.current('LEFT');
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            onDirectionChangeRef.current('RIGHT');
            break;
          case ' ':
            sfx.playClick();
            onTogglePauseRef.current();
            break;
        }
      } else if (activeStatus === 'PAUSED') {
        if (e.key === ' ' || e.key === 'Escape') {
          sfx.playClick();
          onTogglePauseRef.current();
        }
      } else if (activeStatus === 'MENU') {
        if (e.key === 'Escape') {
          sfx.playClick();
          onReturnToMenuRef.current();
        } else if (e.key === 'Enter' || e.key === ' ') {
          onStartGameRef.current();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => ({
        ...prev,
        [e.key.toLowerCase()]: false,
        [e.key]: false,
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return {
    pressedKeys,
    setPressedKeys,
  };
}
export default useKeyboardControls;
