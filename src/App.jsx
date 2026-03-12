import { useState, useCallback } from 'react';
import SetupScreen from './components/SetupScreen.jsx';
import GameScreen from './components/GameScreen.jsx';

export default function App() {
  const [gameConfig, setGameConfig] = useState(null);

  const handleStart = useCallback((config) => setGameConfig(config), []);
  const handleMenu  = useCallback(() => setGameConfig(null), []);

  return gameConfig
    ? <GameScreen key={JSON.stringify(gameConfig)} config={gameConfig} onMenu={handleMenu} />
    : <SetupScreen onStart={handleStart} />;
}
