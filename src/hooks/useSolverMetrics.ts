import { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import * as storage from '../utils/storage';

// Types matching backend metrics
export interface AuctionMetrics {
  auctionId: string;
  timestamp: number;
  orderCount: number;
  liquidityCount: number;
  solveTimeMs: number;
  success: boolean;
  error?: string;

  solutionFound: boolean;
  surplus?: string;
  score?: string;
  gasEstimate?: number;
  routeCount?: number;
  cowMatchCount?: number;

  protocolsUsed?: string[];

  submitted?: boolean;
  won?: boolean;
  competitorCount?: number;
}

export interface SolverStats {
  totalAuctions: number;
  successfulSolves: number;
  failedSolves: number;
  timeouts: number;

  solutionsSubmitted: number;
  auctionsWon: number;
  winRate: number;

  avgSolveTimeMs: number;
  p50SolveTimeMs: number;
  p95SolveTimeMs: number;
  p99SolveTimeMs: number;

  totalSurplusGenerated: string;
  avgSurplusPerAuction: string;
  totalGasCost: string;
  netProfit: string;

  totalCoWMatches: number;
  totalLiquidityRoutes: number;
  avgRoutesPerAuction: number;

  protocolUsage: { [protocol: string]: number };

  oracleSuccessRate: number;
  oracleFallbackRate: number;

  errorCounts: { [errorType: string]: number };

  uptime: number;
  lastAuctionTime?: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  winRate: number;
  surplus: string;
  solveTime: number;
  auctionCount: number;
}

export interface OracleMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackUsed: number;
  avgLatencyMs: number;
}

export type ConnectionMode = 'connecting' | 'connected' | 'disconnected';

interface SolverMetricsData {
  stats: SolverStats | null;
  recentAuctions: AuctionMetrics[];
  timeSeries: TimeSeriesPoint[];
  oracleMetrics: OracleMetrics | null;
  connected: boolean;
  loading: boolean;
  connectionMode: ConnectionMode;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  retryConnection: () => void;
}

// Default WebSocket URL
const DEFAULT_WS_URL = process.env.REACT_APP_SOLVER_WS_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://cow-solver-production.up.railway.app'
    : 'http://localhost:8000');

export function useSolverMetrics(): SolverMetricsData {
  // Load initial state from localStorage
  const [stats, setStats] = useState<SolverStats | null>(() => storage.loadStats());
  const [recentAuctions, setRecentAuctions] = useState<AuctionMetrics[]>(() => storage.loadAuctions());
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>(() => storage.loadTimeSeries());
  const [oracleMetrics, setOracleMetrics] = useState<OracleMetrics | null>(() => storage.loadOracleMetrics());
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('connecting');
  const [loading, setLoading] = useState(true);
  const [apiUrl, setApiUrlState] = useState<string>(() => storage.getApiUrl() || DEFAULT_WS_URL);

  const socketRef = useRef<Socket | null>(null);
  const reconnectCountRef = useRef<number>(0);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (stats) storage.saveStats(stats);
  }, [stats]);

  useEffect(() => {
    if (recentAuctions.length > 0) storage.saveAuctions(recentAuctions);
  }, [recentAuctions]);

  useEffect(() => {
    if (timeSeries.length > 0) storage.saveTimeSeries(timeSeries);
  }, [timeSeries]);

  useEffect(() => {
    if (oracleMetrics) storage.saveOracleMetrics(oracleMetrics);
  }, [oracleMetrics]);

  const setApiUrl = useCallback((url: string) => {
    setApiUrlState(url);
    storage.setApiUrl(url);
    // Trigger reconnection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setConnectionMode('connecting');
    reconnectCountRef.current = 0;
  }, []);

  const retryConnection = useCallback(() => {
    setConnectionMode('connecting');
    reconnectCountRef.current = 0;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('Connecting to Solver WebSocket:', apiUrl);
    setConnectionMode('connecting');

    const socket: Socket = io(apiUrl, {
      path: '/solver-ws',
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Solver WebSocket:', socket.id);
      setConnectionMode('connected');
      setLoading(false);
      reconnectCountRef.current = 0;
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Solver WebSocket:', reason);
      setConnectionMode('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Solver WebSocket connection error:', error);
      reconnectCountRef.current++;

      if (reconnectCountRef.current >= 3) {
        setConnectionMode('disconnected');
        setLoading(false);
      }
    });

    // Listen for stats updates
    socket.on('stats', (data: SolverStats) => {
      setStats(data);
    });

    // Listen for auction history
    socket.on('auctionHistory', (data: AuctionMetrics[]) => {
      setRecentAuctions(prev => storage.mergeAuctions(prev, data));
    });

    // Listen for new auction updates
    socket.on('auctionUpdate', (data: AuctionMetrics) => {
      setRecentAuctions(prev => [...prev.slice(-99), data]);
    });

    // Listen for time series data
    socket.on('timeSeries', (data: TimeSeriesPoint[]) => {
      setTimeSeries(prev => storage.mergeTimeSeries(prev, data));
    });

    // Listen for time series updates
    socket.on('timeSeriesUpdate', (point: TimeSeriesPoint) => {
      setTimeSeries(prev => [...prev.slice(-499), point]);
    });

    // Listen for oracle metrics
    socket.on('oracleMetrics', (data: OracleMetrics) => {
      setOracleMetrics(data);
    });

    // Listen for metrics reset
    socket.on('metricsReset', () => {
      setStats(null);
      setRecentAuctions([]);
      setTimeSeries([]);
      setOracleMetrics(null);
      storage.clearAllData();
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl]);

  return {
    stats,
    recentAuctions,
    timeSeries,
    oracleMetrics,
    connected: connectionMode === 'connected',
    loading,
    connectionMode,
    apiUrl,
    setApiUrl,
    retryConnection,
  };
}
