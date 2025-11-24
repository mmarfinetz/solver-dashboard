/**
 * Converts a value from wei (smallest ETH unit) to ETH.
 * 1 ETH = 10^18 wei
 *
 * @param weiValue - The value in wei as a string or number
 * @returns The value in ETH as a number
 */
export function weiToEth(weiValue: string | number): number {
  const wei = typeof weiValue === 'string' ? parseFloat(weiValue) : weiValue;
  if (isNaN(wei)) return 0;
  return wei / 1e18;
}

/**
 * Formats an ETH value with the specified number of decimal places.
 *
 * @param ethValue - The value in ETH
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted string with ETH suffix
 */
export function formatEth(ethValue: number, decimals: number = 6): string {
  return `${ethValue.toFixed(decimals)} ETH`;
}

/**
 * Converts wei to ETH and formats it as a string.
 *
 * @param weiValue - The value in wei as a string or number
 * @param decimals - Number of decimal places (default: 6)
 * @returns Formatted string with ETH suffix
 */
export function formatWeiAsEth(weiValue: string | number, decimals: number = 6): string {
  return formatEth(weiToEth(weiValue), decimals);
}
