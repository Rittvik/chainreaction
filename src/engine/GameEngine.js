import { PLAYER_COLORS, AI_DELAY_MS, EXPLODE_DELAY_MS } from './constants.js';
import { sleep, criticalMass, neighbours } from './helpers.js';
import { AIPlayer } from './AIPlayer.js';

export class GameEngine {
  /**
   * @param {object} config   - { mode, gridStyle, names }
   * @param {object} gridDef  - { cols, rows } from GRID_STYLES
   * @param {function} onUpdate - called after every board mutation
   */
  constructor(config, gridDef, onUpdate) {
    this.mode      = config.mode;
    this.gridStyle = config.gridStyle;
    this.rows      = gridDef.rows;
    this.cols      = gridDef.cols;
    this.onUpdate  = onUpdate;

    this.players = config.names.map((name, i) => ({
      id:    i,
      name,
      color: PLAYER_COLORS[i].color,
      glow:  PLAYER_COLORS[i].glow,
      orbs:  0,
      alive: true,
      isAI:  config.mode === 'ai' && i === 1,
    }));

    // board[r][c] = { owner: -1|playerIdx, count: 0 }
    this.board = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({ owner: -1, count: 0 }))
    );

    this.currentPlayer = 0;
    this.busy          = false;
    this.gameOver      = false;
    this.winner        = null;
    this.firstMoves    = new Set();
    this.explodingCells = new Set(); // "r,c" keys currently animating
  }

  /** Snapshot of state for React – intentionally cheap shallow copy */
  snapshot() {
    return {
      board:          this.board.map(row => row.map(cell => ({ ...cell }))),
      players:        this.players.map(p => ({ ...p })),
      currentPlayer:  this.currentPlayer,
      gameOver:       this.gameOver,
      winner:         this.winner,
      explodingCells: new Set(this.explodingCells),
      aiThinking:     this._aiThinking || false,
    };
  }

  getCell(r, c) { return this.board[r][c]; }

  async placeOrb(r, c) {
    if (this.busy || this.gameOver) return false;
    const cell   = this.getCell(r, c);
    const player = this.players[this.currentPlayer];

    if (cell.owner !== -1 && cell.owner !== this.currentPlayer) return false;

    this.busy = true;

    cell.owner  = this.currentPlayer;
    cell.count += 1;
    player.orbs += 1;
    this.firstMoves.add(this.currentPlayer);

    this.onUpdate(this.snapshot());

    await this._processExplosions(r, c);

    if (!this.gameOver) {
      this._nextTurn();
    }

    this.busy = false;
    return true;
  }

  async _processExplosions(startR, startC) {
    let toCheck = [[startR, startC]];

    while (toCheck.length > 0) {
      const nextWave = [];

      for (const [r, c] of toCheck) {
        const cell = this.getCell(r, c);
        const cm   = criticalMass(r, c, this.rows, this.cols);
        if (cell.count >= cm) {
          // Mark as exploding for animation
          this.explodingCells.add(`${r},${c}`);
          const prevOwner = cell.owner;

          this.players[prevOwner].orbs -= cm;
          cell.count -= cm;
          if (cell.count === 0) cell.owner = -1;

          for (const [nr, nc] of neighbours(r, c, this.rows, this.cols)) {
            const nb = this.getCell(nr, nc);
            if (nb.owner !== -1 && nb.owner !== prevOwner) {
              this.players[nb.owner].orbs -= nb.count;
              nb.owner = prevOwner;
              this.players[prevOwner].orbs += nb.count;
            }
            nb.owner  = prevOwner;
            nb.count += 1;
            this.players[prevOwner].orbs += 1;
            nextWave.push([nr, nc]);
          }
        }
      }

      if (nextWave.length > 0) {
        this.onUpdate(this.snapshot());
        await sleep(EXPLODE_DELAY_MS);
        // Clear exploding markers for next wave
        this.explodingCells.clear();

        if (this._checkWin()) return;
      }

      toCheck = nextWave.filter(([r, c]) => {
        const cell = this.getCell(r, c);
        return cell.count >= criticalMass(r, c, this.rows, this.cols);
      });
    }

    this.explodingCells.clear();
    this.onUpdate(this.snapshot());
  }

  _checkWin() {
    if (this.firstMoves.size < this.players.length) return false;
    this.players.forEach(p => { if (p.orbs <= 0) { p.alive = false; p.orbs = 0; } });
    const alive = this.players.filter(p => p.alive);
    if (alive.length === 1) {
      this.gameOver = true;
      this.winner   = alive[0];
      this.onUpdate(this.snapshot());
      return true;
    }
    return false;
  }

  _nextTurn() {
    let next = (this.currentPlayer + 1) % this.players.length;
    let loops = 0;
    while (!this.players[next].alive && loops < this.players.length) {
      next = (next + 1) % this.players.length;
      loops++;
    }
    this.currentPlayer = next;
    this.onUpdate(this.snapshot());

    if (this.players[this.currentPlayer].isAI) {
      this._aiThinking = true;
      this.onUpdate(this.snapshot());
      setTimeout(() => this._doAIMove(), AI_DELAY_MS);
    }
  }

  async _doAIMove() {
    this._aiThinking = false;
    if (this.gameOver) return;
    const move = AIPlayer.selectMove(this);
    if (move) await this.placeOrb(move[0], move[1]);
  }
}
