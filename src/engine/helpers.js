export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function criticalMass(row, col, rows, cols) {
  const edgeR = row === 0 || row === rows - 1 ? 1 : 0;
  const edgeC = col === 0 || col === cols - 1 ? 1 : 0;
  return 4 - edgeR - edgeC;
}

export function neighbours(row, col, rows, cols) {
  const result = [];
  if (row > 0)        result.push([row - 1, col]);
  if (row < rows - 1) result.push([row + 1, col]);
  if (col > 0)        result.push([row, col - 1]);
  if (col < cols - 1) result.push([row, col + 1]);
  return result;
}
