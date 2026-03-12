import { useRef, useState, useCallback, useEffect } from 'react';
import { GRID_STYLES } from '../engine/constants.js';
import { GameEngine }  from '../engine/GameEngine.js';
import ScorePanel      from './ScorePanel.jsx';
import GameGrid        from './GameGrid.jsx';
import WinOverlay      from './WinOverlay.jsx';
import AIThinking      from './AIThinking.jsx';

export default function GameScreen({ config, onMenu }) {
  const gridDef   = GRID_STYLES[config.gridStyle];
  const engineRef = useRef(null);

  const [snap, setSnap] = useState(() => {
    const engine = new GameEngine(config, gridDef, (s) => setSnap(s));
    engineRef.current = engine;
    return engine.snapshot();
  });

  const handleCellClick = useCallback(async (r, c) => {
    const engine = engineRef.current;
    if (!engine || engine.busy || engine.gameOver) return;
    if (engine.players[engine.currentPlayer].isAI) return;
    await engine.placeOrb(r, c);
  }, []);

  const handleRestart = useCallback(() => {
    const engine = new GameEngine(config, gridDef, (s) => setSnap(s));
    engineRef.current = engine;
    setSnap(engine.snapshot());
  }, [config, gridDef]);

  return (
    <div id="game-screen" className="screen active">
      <header className="game-header">
        <button className="back-btn" onClick={onMenu}>← Menu</button>
        <div className="turn-indicator" id="turn-indicator">
          <div
            className="turn-orb"
            style={{
              background: snap.players[snap.currentPlayer]?.color,
              boxShadow:  `0 0 12px ${snap.players[snap.currentPlayer]?.color}`,
            }}
          />
          <span>
            {snap.players[snap.currentPlayer]?.name}
            {snap.players[snap.currentPlayer]?.isAI ? ' 🤖' : ''}'s Turn
          </span>
        </div>
        <button className="restart-btn" onClick={handleRestart}>↺ Restart</button>
      </header>

      <main className="game-main">
        <ScorePanel players={snap.players} currentPlayer={snap.currentPlayer} gameOver={snap.gameOver} />
        <GameGrid
          gridStyle={config.gridStyle}
          rows={gridDef.rows}
          cols={gridDef.cols}
          board={snap.board}
          players={snap.players}
          explodingCells={snap.explodingCells}
          onCellClick={handleCellClick}
        />
      </main>

      <AIThinking visible={snap.aiThinking} />
      {snap.gameOver && snap.winner && (
        <WinOverlay winner={snap.winner} onPlayAgain={handleRestart} onMenu={onMenu} />
      )}
    </div>
  );
}
