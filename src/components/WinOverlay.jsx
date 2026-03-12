export default function WinOverlay({ winner, onPlayAgain, onMenu }) {
  return (
    <div className="overlay">
      <div className="win-card">
        <div className="win-emoji">🏆</div>
        <h2 className="win-title" style={{ color: winner.color }}>{winner.name} Wins!</h2>
        <p className="win-sub">
          {winner.isAI
            ? 'The AI has conquered the board. Try again?'
            : 'Chain reactions mastered. Well played!'}
        </p>
        <div className="win-actions">
          <button className="win-btn primary" onClick={onPlayAgain}>Play Again</button>
          <button className="win-btn secondary" onClick={onMenu}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
