/* ═══════════════════════════════════════════════════════════════
   CHAIN REACTION — game.js
   Handles: setup UI, game engine, chain-reaction BFS, AI player
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── Constants ────────────────────────────────────────────────
const PLAYER_COLORS = [
  { color: '#ff4f6d', glow: '#ff4f6d66', name: 'Crimson'  },
  { color: '#4fa8ff', glow: '#4fa8ff66', name: 'Azure'    },
  { color: '#4fffb0', glow: '#4fffb066', name: 'Emerald'  },
  { color: '#ffb84f', glow: '#ffb84f66', name: 'Amber'    },
  { color: '#c77dff', glow: '#c77dff66', name: 'Violet'   },
  { color: '#ff7f4f', glow: '#ff7f4f66', name: 'Coral'    },
];

const GRID_STYLES = {
  classic: { cols: 7, rows: 9, label: 'Classic' },
  neon:    { cols: 6, rows: 8, label: 'Neon'    },
};

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const AI_DELAY_MS  = 600;   // "thinking" pause
const EXPLODE_DELAY_MS = 160; // wave-step delay

// ─── Helpers ──────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function criticalMass(row, col, rows, cols) {
  // corner=2, edge=3, interior=4
  const isTop    = row === 0;
  const isBottom = row === rows - 1;
  const isLeft   = col === 0;
  const isRight  = col === cols - 1;
  let corners = (isTop || isBottom ? 1 : 0) + (isLeft || isRight ? 1 : 0);
  return 4 - corners;
}

function neighbours(row, col, rows, cols) {
  const result = [];
  if (row > 0)        result.push([row - 1, col]);
  if (row < rows - 1) result.push([row + 1, col]);
  if (col > 0)        result.push([row, col - 1]);
  if (col < cols - 1) result.push([row, col + 1]);
  return result;
}

// ═══════════════════════════════════════════════════════════════
//  SETUP SCREEN LOGIC
// ═══════════════════════════════════════════════════════════════
class SetupScreen {
  constructor() {
    this.playerCount  = 2;
    this.gridStyle    = 'classic';
    this.gameMode     = 'multiplayer'; // 'multiplayer' | 'ai'

    this._bindEvents();
    this._renderPlayerInputs();
  }

  _bindEvents() {
    // Mode toggle
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.gameMode = btn.dataset.mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._onModeChange();
      });
    });

    // Grid style
    document.querySelectorAll('.style-card').forEach(card => {
      card.addEventListener('click', () => {
        this.gridStyle = card.dataset.style;
        document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        card.querySelector('input').checked = true;
        this._onModeChange();
      });
    });

    // Player count
    document.getElementById('count-minus').addEventListener('click', () => {
      if (this.playerCount > MIN_PLAYERS) {
        this.playerCount--;
        this._renderPlayerInputs();
        this._updateCountDisplay();
      }
    });
    document.getElementById('count-plus').addEventListener('click', () => {
      if (this.playerCount < MAX_PLAYERS) {
        this.playerCount++;
        this._renderPlayerInputs();
        this._updateCountDisplay();
      }
    });

    // Start
    document.getElementById('start-btn').addEventListener('click', () => this._launch());
  }

  _onModeChange() {
    const pcSection = document.getElementById('player-count-section');
    if (this.gameMode === 'ai') {
      pcSection.style.display = 'none';
      this.playerCount = 2; // always 2 in AI mode
      this._renderPlayerInputs(true /* isAIMode */);
    } else {
      pcSection.style.display = '';
      this._renderPlayerInputs(false);
    }
  }

  _updateCountDisplay() {
    document.getElementById('player-count-display').textContent = this.playerCount;
    document.getElementById('count-minus').disabled = this.playerCount <= MIN_PLAYERS;
    document.getElementById('count-plus').disabled  = this.playerCount >= MAX_PLAYERS;
  }

  _renderPlayerInputs(isAIMode = false) {
    const container = document.getElementById('player-inputs');
    container.innerHTML = '';
    const count = isAIMode ? 2 : this.playerCount;

    for (let i = 0; i < count; i++) {
      const { color } = PLAYER_COLORS[i];
      const row = document.createElement('div');
      row.className = 'player-input-row';

      const dot = document.createElement('div');
      dot.className = 'player-dot';
      dot.style.background = color;
      dot.style.color = color;

      const input = document.createElement('input');
      input.type = 'text';
      input.id   = `player-name-${i}`;
      input.placeholder = isAIMode && i === 1 ? 'AI Opponent' : `Player ${i + 1}`;
      input.maxLength = 18;
      input.style.setProperty('--color', color);
      if (isAIMode && i === 1) {
        input.value = 'AI';
        input.disabled = true;
        input.style.opacity = '0.5';
      }

      row.appendChild(dot);
      row.appendChild(input);
      container.appendChild(row);
    }

    this._updateCountDisplay();
  }

  _getPlayerNames() {
    const names = [];
    const count = this.gameMode === 'ai' ? 2 : this.playerCount;
    for (let i = 0; i < count; i++) {
      const input = document.getElementById(`player-name-${i}`);
      const raw   = input ? input.value.trim() : '';
      names.push(raw || (i === 1 && this.gameMode === 'ai' ? 'AI' : `Player ${i + 1}`));
    }
    return names;
  }

  _launch() {
    const names = this._getPlayerNames();
    const config = {
      mode:      this.gameMode,
      gridStyle: this.gridStyle,
      names,
    };
    startGame(config);
  }
}

// ═══════════════════════════════════════════════════════════════
//  GAME ENGINE
// ═══════════════════════════════════════════════════════════════
class GameEngine {
  constructor(config) {
    this.mode      = config.mode;
    this.gridStyle = config.gridStyle;
    this.gs        = GRID_STYLES[config.gridStyle];
    this.rows      = this.gs.rows;
    this.cols      = this.gs.cols;

    // Build players
    this.players = config.names.map((name, i) => ({
      id:   i,
      name,
      color: PLAYER_COLORS[i].color,
      glow:  PLAYER_COLORS[i].glow,
      orbs:  0,
      alive: true,
      isAI:  this.mode === 'ai' && i === 1,
    }));

    // Board: 2D array of { owner: -1|playerIdx, count: 0 }
    this.board = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({ owner: -1, count: 0 }))
    );

    this.currentPlayer = 0;
    this.moveCount     = 0;  // used to delay elimination check
    this.busy          = false; // lock during animations
    this.gameOver      = false;
    this.firstMoves    = new Set(); // track players who haven't moved yet
  }

  playerCount() { return this.players.length; }

  getCell(r, c) { return this.board[r][c]; }

  // Try to place an orb for currentPlayer on (r,c)
  async placeOrb(r, c) {
    if (this.busy || this.gameOver) return false;
    const cell = this.getCell(r, c);
    const player = this.players[this.currentPlayer];

    // Can only place on empty or own cell
    if (cell.owner !== -1 && cell.owner !== this.currentPlayer) return false;

    this.busy = true;

    cell.owner  = this.currentPlayer;
    cell.count += 1;
    player.orbs += 1;
    this.firstMoves.add(this.currentPlayer);
    this.moveCount++;

    renderCell(r, c, this);
    updateScorePanel(this);

    // Check for explosions
    await this._processExplosions(r, c);

    if (!this.gameOver) {
      this._nextTurn();
    }

    this.busy = false;
    return true;
  }

  async _processExplosions(startR, startC) {
    // BFS: collect all cells that need to explode, wave by wave
    let toCheck = [[startR, startC]];

    while (toCheck.length > 0) {
      const nextWave = [];

      for (const [r, c] of toCheck) {
        const cell = this.getCell(r, c);
        const cm   = criticalMass(r, c, this.rows, this.cols);
        if (cell.count >= cm) {
          // explode
          explodeCell(r, c, cell.owner, this);
          const prevOwner = cell.owner;

          // subtract orbs from this cell
          this.players[prevOwner].orbs -= cm;
          cell.count -= cm;
          if (cell.count === 0) {
            cell.owner = -1;
          }

          // spread to neighbours
          const nbrs = neighbours(r, c, this.rows, this.cols);
          for (const [nr, nc] of nbrs) {
            const nb = this.getCell(nr, nc);
            if (nb.owner !== -1 && nb.owner !== prevOwner) {
              // capture: remove from old owner's count
              this.players[nb.owner].orbs -= nb.count;
              nb.owner = prevOwner;
              this.players[prevOwner].orbs += nb.count;
            }
            nb.owner = prevOwner;
            nb.count += 1;
            this.players[prevOwner].orbs += 1;
            nextWave.push([nr, nc]);
          }
        }
      }

      if (nextWave.length > 0) {
        // Re-render the whole board after each wave step
        await sleep(EXPLODE_DELAY_MS);
        renderBoard(this);
        updateScorePanel(this);

        // Check win after each wave
        if (this._checkWin()) return;
      }

      // Only continue with cells that are now over critical mass
      toCheck = nextWave.filter(([r, c]) => {
        const cell = this.getCell(r, c);
        return cell.count >= criticalMass(r, c, this.rows, this.cols);
      });
    }
  }

  _checkWin() {
    // Win condition: only valid after every player has made at least one move
    if (this.firstMoves.size < this.players.length) return false;
    // Check if any living player has 0 orbs
    let alivePlayers = this.players.filter(p => p.alive);
    // Eliminate those with 0 orbs
    alivePlayers.forEach(p => {
      if (p.orbs <= 0) {
        p.alive = false;
        p.orbs  = 0;
      }
    });
    alivePlayers = this.players.filter(p => p.alive);
    if (alivePlayers.length === 1) {
      this.gameOver = true;
      showWin(alivePlayers[0], this);
      return true;
    }
    return false;
  }

  _nextTurn() {
    let next = (this.currentPlayer + 1) % this.players.length;
    // Skip eliminated players
    let loops = 0;
    while (!this.players[next].alive && loops < this.players.length) {
      next = (next + 1) % this.players.length;
      loops++;
    }
    if (loops >= this.players.length) return; // all eliminated — shouldn't happen
    this.currentPlayer = next;
    updateTurnIndicator(this);
    updateScorePanel(this);

    // If AI's turn, trigger AI move
    if (this.players[this.currentPlayer].isAI) {
      showAIThinking(true);
      setTimeout(() => this._doAIMove(), AI_DELAY_MS);
    }
  }

  async _doAIMove() {
    showAIThinking(false);
    if (this.gameOver) return;

    const move = AIPlayer.selectMove(this);
    if (move) {
      await this.placeOrb(move[0], move[1]);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  AI PLAYER  — greedy 1-ply lookahead with danger-awareness
// ═══════════════════════════════════════════════════════════════
class AIPlayer {
  /**
   * Score a potential move for the AI (player index = 1 always in AI mode).
   * Higher = better for AI.
   */
  static _score(engine, r, c) {
    const ai   = 1; // AI is always player index 1
    const cell = engine.getCell(r, c);
    const cm   = criticalMass(r, c, engine.rows, engine.cols);
    let score  = 0;

    // Reject opponent cells
    if (cell.owner !== -1 && cell.owner !== ai) return -Infinity;

    // ── Explosion potential ──────────────────────────────────────
    const willExplode = (cell.count + 1) >= cm;
    if (willExplode) score += 120;

    // Building pressure: reward cells already close to critical mass
    score += cell.count * 12;

    const nbrs = neighbours(r, c, engine.rows, engine.cols);

    // ── Danger check (highest priority) ─────────────────────────
    // If an adjacent OPPONENT cell is already at (cm-1), placing here
    // lets them explode onto us on the very next move — massive penalty.
    for (const [nr, nc] of nbrs) {
      const nb  = engine.getCell(nr, nc);
      const ncm = criticalMass(nr, nc, engine.rows, engine.cols);
      if (nb.owner !== -1 && nb.owner !== ai) {
        const orbsNeededToExplode = ncm - nb.count;
        if (orbsNeededToExplode <= 1) {
          // Opponent can explode right onto us next turn — big penalty
          score -= 200;
        } else if (orbsNeededToExplode === 2) {
          // Two moves away from opponent explosion — moderate caution
          score -= 40;
        } else {
          // General adjacency-to-opponent pressure (good for attack, not early game)
          score += 20;
        }
        // Extra bonus if WE will explode onto them
        if (willExplode) score += 80;
      }
    }

    // ── Early-game spread bonus ─────────────────────────────────
    // Count total orbs on board to detect early game phase
    let totalOrbs = 0;
    for (let rr = 0; rr < engine.rows; rr++)
      for (let cc = 0; cc < engine.cols; cc++)
        totalOrbs += engine.getCell(rr, cc).count;

    if (totalOrbs <= 4) {
      // Early game: strongly prefer to spread to distant corners/edges
      // rather than clustering near the opponent
      let minOppDist = Infinity;
      for (let rr = 0; rr < engine.rows; rr++) {
        for (let cc = 0; cc < engine.cols; cc++) {
          const nb = engine.getCell(rr, cc);
          if (nb.owner !== -1 && nb.owner !== ai) {
            const dist = Math.abs(r - rr) + Math.abs(c - cc);
            if (dist < minOppDist) minOppDist = dist;
          }
        }
      }
      // Reward distance from opponent in early game
      if (minOppDist !== Infinity) score += minOppDist * 18;
      // Extra strong corner/edge preference in early game
      if (cm === 2) score += 35; // corner
      if (cm === 3) score += 18; // edge
    } else {
      // Mid/late game: mild corner/edge preference
      if (cm === 2) score += 8;
      if (cm === 3) score += 3;
    }

    return score;
  }

  static selectMove(engine) {
    const ai = 1;
    let best  = -Infinity;
    let moves = [];

    for (let r = 0; r < engine.rows; r++) {
      for (let c = 0; c < engine.cols; c++) {
        const cell = engine.getCell(r, c);
        if (cell.owner !== -1 && cell.owner !== ai) continue;
        const s = AIPlayer._score(engine, r, c);
        if (s > best)       { best = s; moves = [[r, c]]; }
        else if (s === best){ moves.push([r, c]); }
      }
    }

    if (moves.length === 0) return null;
    // Among equally-scored moves, pick randomly to vary behaviour
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

// ═══════════════════════════════════════════════════════════════
//  DYNAMIC GRID SIZING
// ═══════════════════════════════════════════════════════════════
/**
 * Computes the largest square cell size that lets the whole grid
 * fit inside .grid-wrapper without scrolling, then applies exact
 * px dimensions to the grid element.
 */
function fitGrid(engine) {
  const wrapper = document.querySelector('.grid-wrapper');
  const grid    = document.getElementById('game-grid');
  if (!wrapper || !grid) return;

  // Guard: if wrapper hasn't been laid out yet, bail out
  // (ResizeObserver or the deferred rAF call will retry)
  if (wrapper.clientWidth === 0 || wrapper.clientHeight === 0) return;

  // Gap and padding values per style (must match CSS)
  const styleMap = {
    classic: { gap: 4, pad: 12 },
    neon:    { gap: 3, pad: 10 },
  };
  const { gap, pad } = styleMap[engine.gridStyle] || styleMap.classic;

  const availW = wrapper.clientWidth  - 8;  // tiny safety margin
  const availH = wrapper.clientHeight - 8;

  const cellByW = (availW - pad * 2 - gap * (engine.cols - 1)) / engine.cols;
  const cellByH = (availH - pad * 2 - gap * (engine.rows - 1)) / engine.rows;
  const cellSize = Math.max(1, Math.floor(Math.min(cellByW, cellByH)));

  const totalW = cellSize * engine.cols + gap * (engine.cols - 1) + pad * 2;
  const totalH = cellSize * engine.rows + gap * (engine.rows - 1) + pad * 2;

  grid.style.width               = `${totalW}px`;
  grid.style.height              = `${totalH}px`;
  grid.style.gridTemplateColumns = `repeat(${engine.cols}, ${cellSize}px)`;
  grid.style.gridTemplateRows    = `repeat(${engine.rows}, ${cellSize}px)`;
}

/** Deferred fit: waits two animation frames so CSS layout settles first. */
function fitGridDeferred(engine) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => fitGrid(engine));
  });
}

// ═══════════════════════════════════════════════════════════════
//  RENDERING
// ═══════════════════════════════════════════════════════════════
function renderBoard(engine) {
  for (let r = 0; r < engine.rows; r++) {
    for (let c = 0; c < engine.cols; c++) {
      renderCell(r, c, engine);
    }
  }
}

function renderCell(r, c, engine) {
  const el   = document.getElementById(`cell-${r}-${c}`);
  if (!el) return;

  const cell = engine.getCell(r, c);
  el.className = 'cell';

  if (cell.owner === -1 || cell.count === 0) {
    el.innerHTML = '';
    el.style.removeProperty('--player-color');
    el.style.removeProperty('--player-glow');
    el.style.removeProperty('--ex-color');
    return;
  }

  const player = engine.players[cell.owner];
  el.classList.add('has-orbs');
  el.style.setProperty('--player-color', player.color);
  el.style.setProperty('--player-glow',  player.glow);
  el.style.setProperty('--ex-color',     player.glow);

  // Orb container
  const container = document.createElement('div');
  container.className = `orb-container orbs-${Math.min(cell.count, 3)}`;

  const visibleOrbs = Math.min(cell.count, 3);
  for (let i = 0; i < visibleOrbs; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.color = player.color;
    orb.style.setProperty('--i', i);
    container.appendChild(orb);
  }

  el.innerHTML = '';
  el.appendChild(container);
}

function explodeCell(r, c, ownerIdx, engine) {
  const el = document.getElementById(`cell-${r}-${c}`);
  if (!el) return;
  const player = engine.players[ownerIdx];
  el.style.setProperty('--ex-color', player.glow);
  el.classList.add('exploding');
  setTimeout(() => el.classList.remove('exploding'), 300);
}

function buildGrid(engine) {
  const grid = document.getElementById('game-grid');
  grid.innerHTML = '';
  grid.className = `game-grid style-${engine.gridStyle}`;
  // columns set by fitGrid; rows defined via gridTemplateRows there too

  for (let r = 0; r < engine.rows; r++) {
    for (let c = 0; c < engine.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id        = `cell-${r}-${c}`;
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', `Row ${r + 1} Column ${c + 1}`);
      cell.addEventListener('click', () => {
        if (!activeEngine || activeEngine.busy || activeEngine.gameOver) return;
        if (activeEngine.players[activeEngine.currentPlayer].isAI) return;
        activeEngine.placeOrb(r, c);
      });
      grid.appendChild(cell);
    }
  }

  // Re-fit on any viewport change (rotation, resize, soft keyboard).
  // ResizeObserver fires immediately after observe(), which handles the
  // initial sizing once the screen has fully laid out.
  if (window._gridResizeObserver) window._gridResizeObserver.disconnect();
  const wrapper = document.querySelector('.grid-wrapper');
  window._gridResizeObserver = new ResizeObserver(() => {
    if (activeEngine) fitGrid(activeEngine);
  });
  window._gridResizeObserver.observe(wrapper);

  // Deferred fallback: ensure sizing runs after CSS transitions settle
  fitGridDeferred(engine);
}

function buildScorePanel(engine) {
  const panel = document.getElementById('score-panel');
  panel.innerHTML = '';
  engine.players.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'score-card';
    card.id        = `score-card-${i}`;
    card.style.setProperty('--player-color', p.color);

    const dot  = document.createElement('div');
    dot.className = 'score-dot';
    dot.style.background = p.color;
    dot.style.boxShadow  = `0 0 8px ${p.color}`;

    const name  = document.createElement('span');
    name.className   = 'score-name';
    name.textContent = p.name + (p.isAI ? ' 🤖' : '');

    const count = document.createElement('span');
    count.className = 'score-count';
    count.id        = `score-count-${i}`;
    count.textContent = '0 orbs';

    card.appendChild(dot);
    card.appendChild(name);
    card.appendChild(count);
    panel.appendChild(card);
  });
}

function updateScorePanel(engine) {
  engine.players.forEach((p, i) => {
    const card  = document.getElementById(`score-card-${i}`);
    const count = document.getElementById(`score-count-${i}`);
    if (!card || !count) return;

    count.textContent = `${p.orbs} orb${p.orbs !== 1 ? 's' : ''}`;

    card.classList.toggle('active-player', i === engine.currentPlayer && !engine.gameOver);
    card.classList.toggle('eliminated',    !p.alive);
  });
}

function updateTurnIndicator(engine) {
  const player = engine.players[engine.currentPlayer];
  const label  = document.getElementById('turn-label');
  const orb    = document.getElementById('turn-orb');
  if (!label || !orb) return;
  label.textContent = `${player.name}${player.isAI ? ' 🤖' : ''}'s Turn`;
  orb.style.background = player.color;
  orb.style.boxShadow  = `0 0 12px ${player.color}`;
}

function showAIThinking(visible) {
  const el = document.getElementById('ai-thinking');
  if (el) el.classList.toggle('visible', visible);
}

function showWin(winner, engine) {
  const overlay = document.getElementById('win-overlay');
  const title   = document.getElementById('win-title');
  const sub     = document.getElementById('win-sub');
  if (!overlay || !title) return;

  title.textContent = `${winner.name} Wins!`;
  title.style.color = winner.color;
  sub.textContent   = winner.isAI
    ? 'The AI has conquered the board. Try again?'
    : 'Chain reactions mastered. Well played!';

  overlay.classList.remove('hidden');
  updateScorePanel(engine);
}

// ═══════════════════════════════════════════════════════════════
//  SCREEN TRANSITIONS
// ═══════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(id);
  if (s) s.classList.add('active');
}

// ═══════════════════════════════════════════════════════════════
//  GLOBAL GAME STATE
// ═══════════════════════════════════════════════════════════════
let activeEngine = null;
let activeConfig = null;

function startGame(config) {
  activeConfig = config;
  activeEngine = new GameEngine(config);

  showScreen('game-screen');
  document.getElementById('win-overlay').classList.add('hidden');
  showAIThinking(false);

  buildGrid(activeEngine);
  buildScorePanel(activeEngine);
  renderBoard(activeEngine);
  updateTurnIndicator(activeEngine);
  updateScorePanel(activeEngine);
}

function restartGame() {
  if (activeConfig) startGame(activeConfig);
}

function goToMenu() {
  activeEngine = null;
  activeConfig = null;
  document.getElementById('win-overlay').classList.add('hidden');
  showAIThinking(false);
  showScreen('setup-screen');
}

// ═══════════════════════════════════════════════════════════════
//  BUTTON WIRE-UP
// ═══════════════════════════════════════════════════════════════
document.getElementById('back-btn').addEventListener('click', goToMenu);
document.getElementById('restart-btn').addEventListener('click', restartGame);
document.getElementById('play-again-btn').addEventListener('click', restartGame);
document.getElementById('main-menu-btn').addEventListener('click', goToMenu);

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
new SetupScreen();
