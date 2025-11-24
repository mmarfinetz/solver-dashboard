import React from 'react';
import { Box, Typography, Grid, Divider } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { SolverStats } from '../../hooks/useSolverMetrics';
import { weiToEth } from '../../utils/formatters';

interface SurplusMetricsProps {
  stats: SolverStats | null;
}

export const SurplusMetrics: React.FC<SurplusMetricsProps> = ({ stats }) => {
  const MetricRow = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
        {icon}
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="h6" fontWeight="medium">
        {value}
      </Typography>
    </Box>
  );

  if (!stats) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Surplus Metrics
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            color: 'text.secondary',
          }}
        >
          <Typography>No data available</Typography>
        </Box>
      </Box>
    );
  }

  const totalSurplus = weiToEth(stats.totalSurplusGenerated);
  const avgSurplus = weiToEth(stats.avgSurplusPerAuction);
  const totalGas = weiToEth(stats.totalGasCost);
  const netProfit = weiToEth(stats.netProfit);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Surplus Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Financial performance
      </Typography>

      <MetricRow
        label="Total Surplus Generated"
        value={`${totalSurplus.toFixed(6)} ETH`}
        icon={<TrendingUpIcon fontSize="small" color="success" />}
      />

      <Divider sx={{ my: 2 }} />

      <MetricRow
        label="Avg Surplus per Auction"
        value={`${avgSurplus.toFixed(6)} ETH`}
        icon={<AttachMoneyIcon fontSize="small" color="primary" />}
      />

      <Divider sx={{ my: 2 }} />

      <MetricRow
        label="Estimated Gas Costs"
        value={`${totalGas.toFixed(6)} ETH`}
        icon={<AttachMoneyIcon fontSize="small" color="warning" />}
      />

      <Divider sx={{ my: 2 }} />

      <MetricRow
        label="Net Profit"
        value={`${netProfit.toFixed(6)} ETH`}
        icon={<TrendingUpIcon fontSize="small" color={netProfit > 0 ? 'success' : 'error'} />}
      />
    </Box>
  );
};
