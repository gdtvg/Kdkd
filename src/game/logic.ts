import { BoardState, GridSize, MoveDirection, TileData } from '../types';

let nextTileId = 1;
export const getUniqueTileId = () => `tile_${Date.now()}_${nextTileId++}`;

/**
 * Returns a 2D matrix [gridSize][gridSize] of TileData | null
 */
export function createGridMatrix(gridSize: GridSize, tiles: TileData[]): (TileData | null)[][] {
  const grid: (TileData | null)[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => null)
  );

  for (const t of tiles) {
    if (t.row >= 0 && t.row < gridSize && t.col >= 0 && t.col < gridSize) {
      grid[t.row][t.col] = t;
    }
  }

  return grid;
}

/**
 * Find all empty cells in the grid
 */
export function getEmptyCells(gridSize: GridSize, tiles: TileData[]): { row: number; col: number }[] {
  const grid = createGridMatrix(gridSize, tiles);
  const empty: { row: number; col: number }[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!grid[r][c]) {
        empty.push({ row: r, col: c });
      }
    }
  }

  return empty;
}

/**
 * Spawn a random tile (2 with 90%, 4 with 10%) on an empty cell
 */
export function spawnRandomTile(gridSize: GridSize, tiles: TileData[]): TileData | null {
  const empty = getEmptyCells(gridSize, tiles);
  if (empty.length === 0) return null;

  const choice = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  return {
    id: getUniqueTileId(),
    value,
    row: choice.row,
    col: choice.col,
    isNew: true,
  };
}

/**
 * Check if any moves are possible
 */
export function hasAvailableMoves(gridSize: GridSize, tiles: TileData[]): boolean {
  if (tiles.length < gridSize * gridSize) {
    return true; // Still has empty cells
  }

  const grid = createGridMatrix(gridSize, tiles);

  // Check adjacent horizontally & vertically
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const current = grid[r][c];
      if (!current) return true;

      // Check right neighbor
      if (c + 1 < gridSize) {
        const right = grid[r][c + 1];
        if (right && right.value === current.value) return true;
      }

      // Check down neighbor
      if (r + 1 < gridSize) {
        const down = grid[r + 1][c];
        if (down && down.value === current.value) return true;
      }
    }
  }

  return false;
}

export interface MoveResult {
  moved: boolean;
  tiles: TileData[];
  scoreGained: number;
  highestMergedValue: number;
}

/**
 * Executes a directional slide and merge on arbitrary gridSize
 */
export function executeMove(gridSize: GridSize, currentTiles: TileData[], direction: MoveDirection): MoveResult {
  const grid = createGridMatrix(gridSize, currentTiles);
  let moved = false;
  let scoreGained = 0;
  let highestMergedValue = 0;

  // Clone current tiles to modify
  const resultTiles: TileData[] = [];
  const mergedMap = new Map<string, TileData>();

  // Helper vectors for traversal
  const isHorizontal = direction === 'left' || direction === 'right';
  const isReversed = direction === 'right' || direction === 'down';

  const rows = Array.from({ length: gridSize }, (_, i) => i);
  const cols = Array.from({ length: gridSize }, (_, i) => i);

  if (direction === 'right') cols.reverse();
  if (direction === 'down') rows.reverse();

  // For each line perpendicular to direction
  const outerList = isHorizontal ? rows : cols;
  const innerList = isHorizontal ? cols : rows;

  for (const outer of outerList) {
    const lineTiles: TileData[] = [];

    for (const inner of innerList) {
      const r = isHorizontal ? outer : inner;
      const c = isHorizontal ? inner : outer;
      const tile = grid[r][c];
      if (tile) {
        lineTiles.push({
          ...tile,
          prevRow: tile.row,
          prevCol: tile.col,
          isNew: false,
          justMerged: false,
        });
      }
    }

    // Merge logic on this line
    const mergedLine: TileData[] = [];
    let skipNext = false;

    for (let i = 0; i < lineTiles.length; i++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const curr = lineTiles[i];
      const next = i + 1 < lineTiles.length ? lineTiles[i + 1] : null;

      if (next && curr.value === next.value) {
        // Merge!
        const mergedValue = curr.value * 2;
        scoreGained += mergedValue;
        if (mergedValue > highestMergedValue) highestMergedValue = mergedValue;

        const mergedTile: TileData = {
          id: getUniqueTileId(),
          value: mergedValue,
          row: 0, // Will be positioned next
          col: 0,
          isNew: false,
          justMerged: true,
        };

        mergedLine.push(mergedTile);
        skipNext = true;
      } else {
        mergedLine.push(curr);
      }
    }

    // Place mergedLine back onto coordinates
    for (let i = 0; i < mergedLine.length; i++) {
      const targetInner = isReversed ? gridSize - 1 - i : i;
      const targetRow = isHorizontal ? outer : targetInner;
      const targetCol = isHorizontal ? targetInner : outer;

      const tile = mergedLine[i];
      if (tile.row !== targetRow || tile.col !== targetCol) {
        moved = true;
      }

      tile.row = targetRow;
      tile.col = targetCol;
      resultTiles.push(tile);
    }
  }

  return {
    moved,
    tiles: resultTiles,
    scoreGained,
    highestMergedValue,
  };
}

/**
 * AI Hint / Expectimax evaluation heuristic:
 * Evaluates best move based on:
 * - Empty cells count
 * - Monotonicity (decreasing values toward corner)
 * - Smoothness (difference between adjacent tiles)
 * - Corner bias for highest tile
 */
export function calculateBestMove(gridSize: GridSize, tiles: TileData[]): MoveDirection | null {
  const directions: MoveDirection[] = ['up', 'down', 'left', 'right'];
  let bestScore = -Infinity;
  let bestDir: MoveDirection | null = null;

  for (const dir of directions) {
    const res = executeMove(gridSize, tiles, dir);
    if (!res.moved) continue;

    // Evaluate heuristic score
    const emptyCount = gridSize * gridSize - res.tiles.length;
    let evalScore = res.scoreGained * 2.0 + emptyCount * 25;

    const grid = createGridMatrix(gridSize, res.tiles);

    // Find max tile and reward top-left or corner position
    let maxVal = 0;
    let maxR = 0;
    let maxC = 0;
    for (const t of res.tiles) {
      if (t.value > maxVal) {
        maxVal = t.value;
        maxR = t.row;
        maxC = t.col;
      }
    }

    const isCorner =
      (maxR === 0 || maxR === gridSize - 1) && (maxC === 0 || maxC === gridSize - 1);
    if (isCorner) {
      evalScore += Math.log2(maxVal) * 30;
    }

    // Monotonicity & smoothness
    let smoothness = 0;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const t = grid[r][c];
        if (!t) continue;

        // Check right
        if (c + 1 < gridSize && grid[r][c + 1]) {
          smoothness -= Math.abs(Math.log2(t.value) - Math.log2(grid[r][c + 1]!.value));
        }
        // Check down
        if (r + 1 < gridSize && grid[r + 1][c]) {
          smoothness -= Math.abs(Math.log2(t.value) - Math.log2(grid[r + 1][c]!.value));
        }
      }
    }

    evalScore += smoothness * 4;

    if (evalScore > bestScore) {
      bestScore = evalScore;
      bestDir = dir;
    }
  }

  return bestDir;
}

/**
 * Initialize a new game board
 */
export function initializeBoard(gridSize: GridSize): BoardState {
  const savedBest = localStorage.getItem(`2048_3d_best_${gridSize}`);
  const bestScore = savedBest ? parseInt(savedBest, 10) || 0 : 0;

  const t1 = spawnRandomTile(gridSize, []);
  const tiles = t1 ? [t1] : [];
  const t2 = spawnRandomTile(gridSize, tiles);
  if (t2) tiles.push(t2);

  return {
    gridSize,
    tiles,
    score: 0,
    bestScore,
    moves: 0,
    gameOver: false,
    won: false,
    hasWonAcknowledged: false,
    timeRemaining: 120, // 2 minutes for time attack
  };
}
