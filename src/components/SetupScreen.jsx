import { useState, useRef, useEffect } from 'react';
import {
  PLAYER_COLORS, ORB_COLORS, ORB_EMOJIS,
  GRID_STYLES, MIN_PLAYERS, MAX_PLAYERS
} from '../engine/constants.js';

// ─── Orb Picker Panel ─────────────────────────────────────────
function OrbPickerPanel({ playerIndex, selectedColor, selectedEmoji, onColorSelect, onEmojiSelect, onClose }) {
  const panelRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [onClose]);

  return (
    <div className="orb-picker-panel" ref={panelRef}>
      {/* Color section */}
      <div className="picker-section-label">Color</div>
      <div className="color-swatch-grid">
        {ORB_COLORS.map((c, i) => (
          <button
            key={i}
            className={`color-swatch${selectedColor === c.color ? ' selected' : ''}`}
            style={{ background: c.color, boxShadow: selectedColor === c.color ? `0 0 0 2px #fff, 0 0 0 4px ${c.color}` : 'none' }}
            onClick={() => onColorSelect(c)}
            aria-label={`Color ${i + 1}`}
          />
        ))}
      </div>

      {/* Emoji section */}
      <div className="picker-section-label" style={{ marginTop: 14 }}>
        Emoji Orb
        {selectedEmoji && (
          <button className="clear-emoji-btn" onClick={() => onEmojiSelect(null)}>✕ Clear</button>
        )}
      </div>
      <div className="emoji-btn-grid">
        {ORB_EMOJIS.map((em, i) => (
          <button
            key={i}
            className={`emoji-btn${selectedEmoji === em ? ' selected' : ''}`}
            onClick={() => onEmojiSelect(em === selectedEmoji ? null : em)}
            aria-label={em}
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Setup Screen ─────────────────────────────────────────
export default function SetupScreen({ onStart }) {
  const [mode,         setMode]         = useState('multiplayer');
  const [gridStyle,    setGridStyle]    = useState('classic');
  const [playerCount,  setPlayerCount]  = useState(2);
  const [names,        setNames]        = useState(Array(MAX_PLAYERS).fill(''));
  const [playerColors, setPlayerColors] = useState(PLAYER_COLORS.map(p => ({ color: p.color, glow: p.glow })));
  const [playerEmojis, setPlayerEmojis] = useState(Array(MAX_PLAYERS).fill(null));
  const [openPicker,   setOpenPicker]   = useState(null); // index or null

  const isAI  = mode === 'ai';
  const count = isAI ? 2 : playerCount;

  function handleNameChange(i, val) {
    setNames(prev => { const n = [...prev]; n[i] = val; return n; });
  }

  function handleColorSelect(playerIdx, colorObj) {
    setPlayerColors(prev => {
      const next = [...prev];
      next[playerIdx] = colorObj;
      return next;
    });
    setOpenPicker(null);
  }

  function handleEmojiSelect(playerIdx, emoji) {
    setPlayerEmojis(prev => {
      const next = [...prev];
      next[playerIdx] = emoji;
      return next;
    });
  }

  function handleStart() {
    const players = Array.from({ length: count }, (_, i) => ({
      name:  isAI && i === 1 ? 'AI' : (names[i].trim() || `Player ${i + 1}`),
      color: playerColors[i].color,
      glow:  playerColors[i].glow,
      emoji: isAI && i === 1 ? null : playerEmojis[i],
    }));
    onStart({ mode, gridStyle, players });
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
                onClick={() => { setMode(m); setOpenPicker(null); }}
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
                    <div className="preview-cell" /><div className={`preview-cell pv-orb${key === 'neon' ? ' neon-orb' : key === 'plasma' ? ' plasma-orb' : ''}`} /><div className="preview-cell" />
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

        {/* Player Setup */}
        <section className="setup-section">
          <h2 className="section-label">Players</h2>
          <div className="player-inputs">
            {Array.from({ length: count }, (_, i) => {
              const color = playerColors[i].color;
              const emoji = playerEmojis[i];
              const isPickerOpen = openPicker === i;
              const isAIPlayer = isAI && i === 1;

              return (
                <div key={i} className="player-setup-block">
                  <div className="player-input-row">
                    {/* Orb customizer button */}
                    <button
                      className={`orb-customize-btn${isPickerOpen ? ' open' : ''}${isAIPlayer ? ' disabled' : ''}`}
                      style={{ background: color, boxShadow: `0 0 10px ${color}88` }}
                      onClick={() => !isAIPlayer && setOpenPicker(isPickerOpen ? null : i)}
                      title={isAIPlayer ? 'AI orb' : 'Customize orb'}
                      aria-label="Customize orb"
                    >
                      {emoji ? (
                        <span className="orb-btn-emoji">{emoji}</span>
                      ) : (
                        <span className="orb-btn-sphere" />
                      )}
                    </button>

                    <input
                      type="text"
                      placeholder={isAIPlayer ? 'AI Opponent' : `Player ${i + 1}`}
                      value={isAIPlayer ? 'AI' : names[i]}
                      disabled={isAIPlayer}
                      maxLength={18}
                      style={{ '--color': color }}
                      onChange={e => handleNameChange(i, e.target.value)}
                    />

                    {/* Emoji badge preview */}
                    {emoji && !isAIPlayer && (
                      <span className="emoji-preview-badge" style={{ borderColor: color }}>
                        {emoji}
                      </span>
                    )}
                  </div>

                  {/* Inline picker panel */}
                  {isPickerOpen && (
                    <OrbPickerPanel
                      playerIndex={i}
                      selectedColor={color}
                      selectedEmoji={emoji}
                      onColorSelect={c => handleColorSelect(i, c)}
                      onEmojiSelect={em => handleEmojiSelect(i, em)}
                      onClose={() => setOpenPicker(null)}
                    />
                  )}
                </div>
              );
            })}
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
