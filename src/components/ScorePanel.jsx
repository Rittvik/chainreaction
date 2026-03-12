export default function ScorePanel({ players, currentPlayer, gameOver }) {
  return (
    <div className="score-panel">
      {players.map((p, i) => (
        <div
          key={i}
          className={`score-card${i === currentPlayer && !gameOver ? ' active-player' : ''}${!p.alive ? ' eliminated' : ''}`}
          style={{ '--player-color': p.color }}
        >
          <div className="score-dot" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
          <span className="score-name">{p.name}{p.isAI ? ' 🤖' : ''}</span>
          <span className="score-count">{p.orbs} orb{p.orbs !== 1 ? 's' : ''}</span>
        </div>
      ))}
    </div>
  );
}
