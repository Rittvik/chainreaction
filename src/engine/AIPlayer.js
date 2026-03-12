import { criticalMass, neighbours } from './helpers.js';

export class AIPlayer {
  static _score(engine, r, c) {
    const ai   = 1;
    const cell = engine.getCell(r, c);
    const cm   = criticalMass(r, c, engine.rows, engine.cols);
    let score  = 0;

    if (cell.owner !== -1 && cell.owner !== ai) return -Infinity;

    const willExplode = (cell.count + 1) >= cm;
    if (willExplode) score += 120;
    score += cell.count * 12;

    const nbrs = neighbours(r, c, engine.rows, engine.cols);

    // Danger check – big penalty for playing next to opponent about to explode
    for (const [nr, nc] of nbrs) {
      const nb  = engine.getCell(nr, nc);
      const ncm = criticalMass(nr, nc, engine.rows, engine.cols);
      if (nb.owner !== -1 && nb.owner !== ai) {
        const need = ncm - nb.count;
        if (need <= 1)      score -= 200; // explodes on us next turn
        else if (need === 2) score -= 40;
        else                 score += 20;
        if (willExplode)     score += 80;
      }
    }

    // Early-game spread: prefer corners far from opponent
    let totalOrbs = 0;
    for (let rr = 0; rr < engine.rows; rr++)
      for (let cc = 0; cc < engine.cols; cc++)
        totalOrbs += engine.getCell(rr, cc).count;

    if (totalOrbs <= 4) {
      let minOppDist = Infinity;
      for (let rr = 0; rr < engine.rows; rr++)
        for (let cc = 0; cc < engine.cols; cc++) {
          const nb = engine.getCell(rr, cc);
          if (nb.owner !== -1 && nb.owner !== ai) {
            const dist = Math.abs(r - rr) + Math.abs(c - cc);
            if (dist < minOppDist) minOppDist = dist;
          }
        }
      if (minOppDist !== Infinity) score += minOppDist * 18;
      if (cm === 2) score += 35; // corner
      if (cm === 3) score += 18; // edge
    } else {
      if (cm === 2) score += 8;
      if (cm === 3) score += 3;
    }

    return score;
  }

  static selectMove(engine) {
    const ai = 1;
    let best = -Infinity;
    let moves = [];

    for (let r = 0; r < engine.rows; r++)
      for (let c = 0; c < engine.cols; c++) {
        const cell = engine.getCell(r, c);
        if (cell.owner !== -1 && cell.owner !== ai) continue;
        const s = AIPlayer._score(engine, r, c);
        if (s > best)        { best = s; moves = [[r, c]]; }
        else if (s === best) { moves.push([r, c]); }
      }

    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }
}
