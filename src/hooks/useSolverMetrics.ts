import { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import * as storage from '../utils/storage';
import * as demoData from '../utils/demoData';

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

export type ConnectionMode = 'connecting' | 'connected' | 'demo' | 'disconnected';

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
  enableDemoMode: () => void;
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
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptRef = useRef<number>(0);

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
  }, []);

  const enableDemoMode = useCallback(() => {
    // Disconnect from real API
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    storage.setDemoMode(true);
    setConnectionMode('demo');
    setLoading(false);

    // Generate initial demo data
    const demoStats = demoData.generateDemoStats();
    const demoAuctions = Array.from({ length: 20 }, () => demoData.generateDemoAuction());
    const demoTimeSeries = demoData.generateDemoTimeSeries(50);
    const demoOracle = demoData.generateDemoOracleMetrics();

    setStats(demoStats);
    setRecentAuctions(prev => storage.mergeAuctions(prev, demoAuctions));
    setTimeSeries(prev => storage.mergeTimeSeries(prev, demoTimeSeries));
    setOracleMetrics(demoOracle);

    // Set up demo data updates
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }

    demoIntervalRef.current = setInterval(() => {
      // Update stats
      setStats(prev => prev ? demoData.updateDemoStats(prev) : demoData.generateDemoStats());

      // Add new auction occasionally
      if (Math.random() > 0.5) {
        const newAuction = demoData.generateDemoAuction();
        setRecentAuctions(prev => [...prev.slice(-99), newAuction]);
      }

      // Add time series point
      setTimeSeries(prev => {
        const lastPoint = prev[prev.length - 1];
        const newPoint: TimeSeriesPoint = {
          timestamp: Date.now(),
          winRate: (lastPoint?.winRate || 35) + (Math.random() - 0.5) * 2,
          surplus: ((parseFloat(lastPoint?.surplus || '0') + Math.random() * 0.1)).toFixed(4),
          solveTime: 150 + Math.random() * 100,
          auctionCount: Math.floor(Math.random() * 10) + 5,
        };
        return [...prev.slice(-499), newPoint];
      });
    }, 3000); // Update every 3 seconds in demo mode
  }, []);

  const retryConnection = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    storage.setDemoMode(false);
    setConnectionMode('connecting');
    connectionAttemptRef.current = 0;

    // Force reconnection by updating the ref
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Check if demo mode was previously enabled
    if (storage.isDemoMode()) {
      enableDemoMode();
      return;
    }

    console.log('Connecting to Solver WebSocket:', apiUrl);
    setConnectionMode('connecting');

    const socket: Socket = io(apiUrl, {
      path: '/solver-ws',
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Solver WebSocket:', socket.id);
      setConnectionMode('connected');
      setLoading(false);
      connectionAttemptRef.current = 0;
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Solver WebSocket:', reason);
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setConnectionMode('disconnected');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Solver WebSocket connection error:', error);
      connectionAttemptRef.current++;

      // After 3 failed attempts, switch to demo mode automatically
      if (connectionAttemptRef.current >= 3) {
        console.log('Connection failed after 3 attempts, switching to demo mode');
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
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, [apiUrl, enableDemoMode]);

  return {
    stats,
    recentAuctions,
    timeSeries,
    oracleMetrics,
    connected: connectionMode === 'connected' || connectionMode === 'demo',
    loading,
    connectionMode,
    apiUrl,
    setApiUrl,
    enableDemoMode,
    retryConnection,
  };
}
