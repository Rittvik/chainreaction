import { useEffect } from 'react';

const CONFETTI_COLORS = ['#ff4f6d','#4fa8ff','#3fffa0','#ffcc4f','#cc77ff','#ff8c4f','#ffffff'];

function spawnConfetti(winColor) {
  const count = 72;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    const color = i % 5 === 0 ? winColor : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${color};
      width: ${6 + Math.random() * 6}px;
      height: ${6 + Math.random() * 6}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.8 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.6}s;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

export default function WinOverlay({ winner, onPlayAgain, onMenu }) {
  useEffect(() => {
    spawnConfetti(winner.color);
  }, [winner.color]);

  return (
    <div className="overlay">
      <div
        className="win-card"
        style={{ '--win-glow': winner.glow || `${winner.color}22` }}
      >
        <span className="win-emoji">{winner.isAI ? '🤖' : '🏆'}</span>
        <h2 className="win-title" style={{ color: winner.color }}>
          {winner.name} Wins!
        </h2>
        <p className="win-sub">
          {winner.isAI
            ? 'The AI has conquered the board. Train harder!'
            : 'Chain reactions mastered. Brilliant play!'}
        </p>
        <div className="win-actions">
          <button className="win-btn primary" onClick={onPlayAgain}>Play Again</button>
          <button className="win-btn secondary" onClick={onMenu}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
