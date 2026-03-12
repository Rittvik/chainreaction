import { useState } from 'react';
import { PLAYER_COLORS, GRID_STYLES, MIN_PLAYERS, MAX_PLAYERS } from '../engine/constants.js';

export default function SetupScreen({ onStart }) {
  const [mode,        setMode]        = useState('multiplayer');
  const [gridStyle,   setGridStyle]   = useState('classic');
  const [playerCount, setPlayerCount] = useState(2);
  const [names,       setNames]       = useState(Array(MAX_PLAYERS).fill(''));

  const isAI      = mode === 'ai';
  const count     = isAI ? 2 : playerCount;

  function handleNameChange(i, val) {
    setNames(prev => { const n = [...prev]; n[i] = val; return n; });
  }

  function handleStart() {
    const finalNames = Array.from({ length: count }, (_, i) => {
      if (isAI && i === 1) return 'AI';
      return names[i].trim() || `Player ${i + 1}`;
    });
    onStart({ mode, gridStyle, names: finalNames });
  }

  return (
    <div id="setup-screen" className="screen active">
      <div className="setup-container">

        {/* Logo */}
        <div className="logo-area">
          <div className="logo-icon">⚛</div>
          <h1 className="logo-text">Chain<span>Reaction</span></h1>
          <p className="logo-sub">Explode. Conquer. Dominate.</p>
        </div>

        {/* Game Mode */}
        <section className="setup-section">
          <h2 className="section-label">Game Mode</h2>
          <div className="mode-toggle">
            {['multiplayer', 'ai'].map(m => (
              <button
                key={m}
                className={`mode-btn${mode === m ? ' active' : ''}`}
                onClick={() => setMode(m)}
              >
                <span className="mode-icon">{m === 'multiplayer' ? '👥' : '🤖'}</span>
                <span className="mode-name">{m === 'multiplayer' ? 'Multiplayer' : 'vs AI'}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Grid Style */}
        <section className="setup-section">
          <h2 className="section-label">Grid Style</h2>
          <div className="grid-style-picker">
            {Object.entries(GRID_STYLES).map(([key, def]) => (
              <label
                key={key}
                className={`style-card${gridStyle === key ? ' active' : ''}`}
                onClick={() => setGridStyle(key)}
              >
                <input type="radio" name="grid-style" value={key} checked={gridStyle === key} onChange={() => setGridStyle(key)} hidden />
                <div className={`style-preview ${key}-preview`}>
                  <div className="preview-grid">
                    <div className="preview-cell" /><div className="preview-cell" /><div className="preview-cell" />
                    <div className="preview-cell" /><div className={`preview-cell pv-orb${key === 'neon' ? ' neon-orb' : ''}`} /><div className="preview-cell" />
                    <div className="preview-cell" /><div className="preview-cell" /><div className="preview-cell" />
                  </div>
                </div>
                <div className="style-info">
                  <span className="style-name">{def.label}</span>
                  <span className="style-dims">{def.cols} × {def.rows}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Player Count */}
        {!isAI && (
          <section className="setup-section">
            <h2 className="section-label">Number of Players</h2>
            <div className="count-selector">
              <button className="count-btn" disabled={playerCount <= MIN_PLAYERS} onClick={() => setPlayerCount(p => p - 1)}>−</button>
              <span className="count-value">{playerCount}</span>
              <button className="count-btn" disabled={playerCount >= MAX_PLAYERS} onClick={() => setPlayerCount(p => p + 1)}>+</button>
            </div>
          </section>
        )}

        {/* Player Names */}
        <section className="setup-section">
          <h2 className="section-label">Player Names</h2>
          <div className="player-inputs">
            {Array.from({ length: count }, (_, i) => (
              <div key={i} className="player-input-row">
                <div className="player-dot" style={{ background: PLAYER_COLORS[i].color, boxShadow: `0 0 8px ${PLAYER_COLORS[i].color}` }} />
                <input
                  type="text"
                  placeholder={isAI && i === 1 ? 'AI Opponent' : `Player ${i + 1}`}
                  value={isAI && i === 1 ? 'AI' : names[i]}
                  disabled={isAI && i === 1}
                  maxLength={18}
                  style={{ '--color': PLAYER_COLORS[i].color }}
                  onChange={e => handleNameChange(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <button className="start-btn" onClick={handleStart}>
          <span>Launch Game</span>
          <span className="btn-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
