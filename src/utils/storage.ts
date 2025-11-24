import { SolverStats, AuctionMetrics, TimeSeriesPoint, OracleMetrics } from '../hooks/useSolverMetrics';

const STORAGE_KEYS = {
  STATS: 'solver_stats',
  AUCTIONS: 'solver_auctions',
  TIME_SERIES: 'solver_time_series',
  ORACLE_METRICS: 'solver_oracle_metrics',
  API_URL: 'solver_api_url',
  LAST_UPDATED: 'solver_last_updated',
};

// Max items to store to prevent localStorage from getting too large
const MAX_AUCTIONS = 500;
const MAX_TIME_SERIES = 1000;

export function saveStats(stats: SolverStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
  } catch (e) {
    console.warn('Failed to save stats to localStorage:', e);
  }
}

export function loadStats(): SolverStats | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to load stats from localStorage:', e);
    return null;
  }
}

export function saveAuctions(auctions: AuctionMetrics[]): void {
  try {
    // Keep only the most recent auctions
    const trimmed = auctions.slice(-MAX_AUCTIONS);
    localStorage.setItem(STORAGE_KEYS.AUCTIONS, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save auctions to localStorage:', e);
  }
}

export function loadAuctions(): AuctionMetrics[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUCTIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load auctions from localStorage:', e);
    return [];
  }
}

export function saveTimeSeries(timeSeries: TimeSeriesPoint[]): void {
  try {
    // Keep only the most recent points
    const trimmed = timeSeries.slice(-MAX_TIME_SERIES);
    localStorage.setItem(STORAGE_KEYS.TIME_SERIES, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save time series to localStorage:', e);
  }
}

export function loadTimeSeries(): TimeSeriesPoint[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TIME_SERIES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load time series from localStorage:', e);
    return [];
  }
}

export function saveOracleMetrics(metrics: OracleMetrics): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORACLE_METRICS, JSON.stringify(metrics));
  } catch (e) {
    console.warn('Failed to save oracle metrics to localStorage:', e);
  }
}

export function loadOracleMetrics(): OracleMetrics | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORACLE_METRICS);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to load oracle metrics from localStorage:', e);
    return null;
  }
}

export function getApiUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_URL);
  } catch (e) {
    return null;
  }
}

export function setApiUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_URL, url);
  } catch (e) {
    console.warn('Failed to save API URL to localStorage:', e);
  }
}

export function getLastUpdated(): number | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    return data ? parseInt(data, 10) : null;
  } catch (e) {
    return null;
  }
}

export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

// Merge new auctions with existing ones, avoiding duplicates
export function mergeAuctions(existing: AuctionMetrics[], newAuctions: AuctionMetrics[]): AuctionMetrics[] {
  const existingIds = new Set(existing.map(a => a.auctionId));
  const unique = newAuctions.filter(a => !existingIds.has(a.auctionId));
  return [...existing, ...unique].slice(-MAX_AUCTIONS);
}

// Merge time series, avoiding duplicate timestamps
export function mergeTimeSeries(existing: TimeSeriesPoint[], newPoints: TimeSeriesPoint[]): TimeSeriesPoint[] {
  const existingTimestamps = new Set(existing.map(p => p.timestamp));
  const unique = newPoints.filter(p => !existingTimestamps.has(p.timestamp));
  return [...existing, ...unique]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_TIME_SERIES);
}
