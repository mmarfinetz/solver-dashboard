import { SolverStats, AuctionMetrics, TimeSeriesPoint, OracleMetrics } from '../hooks/useSolverMetrics';

// Generate realistic demo data for when the API is unavailable
export function generateDemoStats(): SolverStats {
  const totalAuctions = Math.floor(Math.random() * 1000) + 500;
  const successfulSolves = Math.floor(totalAuctions * 0.85);
  const auctionsWon = Math.floor(successfulSolves * 0.35);

  return {
    totalAuctions,
    successfulSolves,
    failedSolves: totalAuctions - successfulSolves - Math.floor(Math.random() * 20),
    timeouts: Math.floor(Math.random() * 20),
    solutionsSubmitted: successfulSolves,
    auctionsWon,
    winRate: (auctionsWon / successfulSolves) * 100,
    avgSolveTimeMs: 150 + Math.random() * 100,
    p50SolveTimeMs: 120 + Math.random() * 50,
    p95SolveTimeMs: 300 + Math.random() * 100,
    p99SolveTimeMs: 500 + Math.random() * 200,
    totalSurplusGenerated: (Math.random() * 50 + 10).toFixed(4),
    avgSurplusPerAuction: (Math.random() * 0.05).toFixed(6),
    totalGasCost: (Math.random() * 5 + 1).toFixed(4),
    netProfit: (Math.random() * 45 + 5).toFixed(4),
    totalCoWMatches: Math.floor(auctionsWon * 0.3),
    totalLiquidityRoutes: Math.floor(totalAuctions * 2.5),
    avgRoutesPerAuction: 2.5 + Math.random(),
    protocolUsage: {
      'Uniswap V3': Math.floor(Math.random() * 300) + 100,
      'Balancer': Math.floor(Math.random() * 200) + 50,
      'Curve': Math.floor(Math.random() * 150) + 30,
      'SushiSwap': Math.floor(Math.random() * 100) + 20,
      '0x': Math.floor(Math.random() * 80) + 10,
    },
    oracleSuccessRate: 95 + Math.random() * 4,
    oracleFallbackRate: Math.random() * 5,
    errorCounts: {
      'timeout': Math.floor(Math.random() * 10),
      'insufficient_liquidity': Math.floor(Math.random() * 15),
      'gas_estimation_failed': Math.floor(Math.random() * 5),
    },
    uptime: Date.now() - Math.floor(Math.random() * 86400000),
    lastAuctionTime: Date.now() - Math.floor(Math.random() * 60000),
  };
}

export function generateDemoAuction(): AuctionMetrics {
  const success = Math.random() > 0.1;
  const solutionFound = success && Math.random() > 0.2;
  const won = solutionFound && Math.random() > 0.6;

  return {
    auctionId: `0x${Math.random().toString(16).slice(2, 10)}`,
    timestamp: Date.now(),
    orderCount: Math.floor(Math.random() * 10) + 1,
    liquidityCount: Math.floor(Math.random() * 20) + 5,
    solveTimeMs: 100 + Math.random() * 400,
    success,
    solutionFound,
    surplus: solutionFound ? (Math.random() * 0.1).toFixed(6) : undefined,
    score: solutionFound ? (Math.random() * 1000000).toFixed(0) : undefined,
    gasEstimate: solutionFound ? Math.floor(200000 + Math.random() * 300000) : undefined,
    routeCount: Math.floor(Math.random() * 5) + 1,
    cowMatchCount: Math.floor(Math.random() * 3),
    protocolsUsed: ['Uniswap V3', 'Balancer', 'Curve'].slice(0, Math.floor(Math.random() * 3) + 1),
    submitted: solutionFound,
    won,
    competitorCount: Math.floor(Math.random() * 8) + 2,
  };
}

export function generateDemoTimeSeries(count: number = 50): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();
  const interval = 60000; // 1 minute intervals

  let cumulativeSurplus = 0;

  for (let i = count - 1; i >= 0; i--) {
    const winRate = 30 + Math.random() * 15 + (i * 0.1); // Gradually improving
    const surplus = Math.random() * 0.5;
    cumulativeSurplus += surplus;

    points.push({
      timestamp: now - (i * interval),
      winRate: Math.min(winRate, 50),
      surplus: cumulativeSurplus.toFixed(4),
      solveTime: 150 + Math.random() * 100,
      auctionCount: Math.floor(Math.random() * 10) + 5,
    });
  }

  return points;
}

export function generateDemoOracleMetrics(): OracleMetrics {
  const totalRequests = Math.floor(Math.random() * 10000) + 5000;
  const successRate = 0.95 + Math.random() * 0.04;

  return {
    totalRequests,
    successfulRequests: Math.floor(totalRequests * successRate),
    failedRequests: Math.floor(totalRequests * (1 - successRate)),
    fallbackUsed: Math.floor(totalRequests * 0.03),
    avgLatencyMs: 50 + Math.random() * 30,
  };
}

// Simulate incremental updates
export function updateDemoStats(current: SolverStats): SolverStats {
  const newAuction = Math.random() > 0.3;
  if (!newAuction) return current;

  const success = Math.random() > 0.1;
  const won = success && Math.random() > 0.6;
  const surplus = won ? Math.random() * 0.1 : 0;

  return {
    ...current,
    totalAuctions: current.totalAuctions + 1,
    successfulSolves: current.successfulSolves + (success ? 1 : 0),
    failedSolves: current.failedSolves + (success ? 0 : 1),
    solutionsSubmitted: current.solutionsSubmitted + (success ? 1 : 0),
    auctionsWon: current.auctionsWon + (won ? 1 : 0),
    winRate: ((current.auctionsWon + (won ? 1 : 0)) / (current.solutionsSubmitted + (success ? 1 : 0))) * 100,
    totalSurplusGenerated: (parseFloat(current.totalSurplusGenerated) + surplus).toFixed(4),
    netProfit: (parseFloat(current.netProfit) + surplus * 0.9).toFixed(4),
    lastAuctionTime: Date.now(),
  };
}
