export function getBalanceCategory(balance: number): string {
  if (balance === 0) return 'No Balance';
  if (balance > 0 && balance <= 0.1) return 'Shrimp (0-0.1 ETH)';
  if (balance > 0.1 && balance <= 1) return 'Crab (0.1-1 ETH)';
  if (balance > 1 && balance <= 10) return 'Fish (1-10 ETH)';
  if (balance > 10 && balance <= 32) return 'Dolphin (10-32 ETH)';
  if (balance > 32) return 'Whale (32+ ETH)';
  return 'Unknown';
}