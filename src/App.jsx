import { useEffect, useCallback } from 'react';
import SetupScreen from './components/SetupScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import { useState } from 'react';

export default function App() {
  const [gameConfig, setGameConfig] = useState(null);

  // Belt-and-suspenders scroll lock for iOS/Android
  useEffect(() => {
    const prevent = (e) => {
      // Allow scroll inside setup screen only
      const setup = document.getElementById('setup-screen');
      if (setup && setup.contains(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  const handleStart = useCallback((config) => setGameConfig(config), []);
  const handleMenu  = useCallback(() => setGameConfig(null), []);

  return gameConfig
    ? <GameScreen key={JSON.stringify(gameConfig)} config={gameConfig} onMenu={handleMenu} />
    : <SetupScreen onStart={handleStart} />;
}
