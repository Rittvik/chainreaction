import { useRef, useEffect } from 'react';

export default function GameGrid({ gridStyle, rows, cols, board, players, explodingCells, onCellClick }) {
  const gridRef = useRef(null);

  // Dynamic cell sizing: fill the wrapper without scrolling
  useEffect(() => {
    const wrapper = gridRef.current?.parentElement;
    if (!wrapper) return;

    const styleMap = { classic: { gap: 4, pad: 12 }, neon: { gap: 3, pad: 10 } };
    const { gap, pad } = styleMap[gridStyle] || styleMap.classic;

    function fitGrid() {
      if (!gridRef.current) return;
      const aW = wrapper.clientWidth  - 8;
      const aH = wrapper.clientHeight - 8;
      if (aW <= 0 || aH <= 0) return;
      const cW = (aW - pad * 2 - gap * (cols - 1)) / cols;
      const cH = (aH - pad * 2 - gap * (rows - 1)) / rows;
      const cs = Math.max(1, Math.floor(Math.min(cW, cH)));
      gridRef.current.style.width               = `${cs * cols + gap * (cols - 1) + pad * 2}px`;
      gridRef.current.style.height              = `${cs * rows + gap * (rows - 1) + pad * 2}px`;
      gridRef.current.style.gridTemplateColumns = `repeat(${cols}, ${cs}px)`;
      gridRef.current.style.gridTemplateRows    = `repeat(${rows}, ${cs}px)`;
    }

    const ro = new ResizeObserver(fitGrid);
    ro.observe(wrapper);
    // Deferred to ensure layout has settled
    requestAnimationFrame(() => requestAnimationFrame(fitGrid));
    return () => ro.disconnect();
  }, [gridStyle, rows, cols]);

  return (
    <div className="grid-wrapper">
      <div ref={gridRef} className={`game-grid style-${gridStyle}`}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const cell     = board[r][c];
            const exploding = explodingCells?.has(`${r},${c}`);
            const player   = cell.owner !== -1 ? players[cell.owner] : null;

            return (
              <div
                key={`${r}-${c}`}
                className={`cell${player ? ' has-orbs' : ''}${exploding ? ' exploding' : ''}`}
                style={player ? {
                  '--player-color': player.color,
                  '--player-glow':  player.glow,
                  '--ex-color':     player.glow,
                } : {}}
                role="button"
                aria-label={`Row ${r + 1} Column ${c + 1}`}
                onClick={() => onCellClick(r, c)}
              >
                {player && cell.count > 0 && (
                  <div className={`orb-container orbs-${Math.min(cell.count, 3)}`}>
                    {Array.from({ length: Math.min(cell.count, 3) }, (_, i) => (
                      <div
                        key={i}
                        className="orb"
                        style={{ color: player.color, '--i': i }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
