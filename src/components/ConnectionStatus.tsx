import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useSolverMetrics, ConnectionMode } from '../hooks/useSolverMetrics';

const getStatusConfig = (mode: ConnectionMode) => {
  switch (mode) {
    case 'connected':
      return { color: 'success.main', label: 'Connected', chipColor: 'success' as const };
    case 'demo':
      return { color: 'warning.main', label: 'Demo Mode', chipColor: 'warning' as const };
    case 'connecting':
      return { color: 'info.main', label: 'Connecting...', chipColor: 'info' as const };
    case 'disconnected':
    default:
      return { color: 'error.main', label: 'Disconnected', chipColor: 'error' as const };
  }
};

export const ConnectionStatus: React.FC = () => {
  const { connectionMode, apiUrl, setApiUrl, enableDemoMode, retryConnection, loading } = useSolverMetrics();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApiUrl, setNewApiUrl] = useState(apiUrl);

  const statusConfig = getStatusConfig(connectionMode);

  const handleSaveUrl = () => {
    if (newApiUrl.trim()) {
      setApiUrl(newApiUrl.trim());
      setDialogOpen(false);
    }
  };

  const handleEnableDemo = () => {
    enableDemoMode();
    setDialogOpen(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {loading && connectionMode === 'connecting' ? (
          <CircularProgress size={14} sx={{ color: 'info.main' }} />
        ) : (
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: statusConfig.color,
              animation: connectionMode === 'connecting' ? 'pulse 1.5s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.4 },
                '100%': { opacity: 1 },
              },
            }}
          />
        )}
        <Tooltip title="Click to configure connection">
          <Chip
            label={statusConfig.label}
            color={statusConfig.chipColor}
            size="small"
            onClick={() => setDialogOpen(true)}
            sx={{ cursor: 'pointer' }}
          />
        </Tooltip>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connection Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Current Status
              </Typography>
              <Chip
                label={statusConfig.label}
                color={statusConfig.chipColor}
                size="small"
              />
            </Box>

            <TextField
              label="API URL"
              value={newApiUrl}
              onChange={(e) => setNewApiUrl(e.target.value)}
              fullWidth
              helperText="WebSocket URL for your solver API (e.g., https://your-api.railway.app)"
              placeholder="https://cow-solver-production.up.railway.app"
            />

            <Box sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle2" gutterBottom>
                Demo Mode
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Can't connect to your API? Enable demo mode to see the dashboard with simulated data.
                Your historical data will be preserved.
              </Typography>
              <Button
                variant="outlined"
                color="warning"
                onClick={handleEnableDemo}
                disabled={connectionMode === 'demo'}
              >
                {connectionMode === 'demo' ? 'Demo Mode Active' : 'Enable Demo Mode'}
              </Button>
            </Box>

            {connectionMode === 'demo' && (
              <Box sx={{
                p: 2,
                bgcolor: 'warning.main',
                borderRadius: 1,
                color: 'warning.contrastText'
              }}>
                <Typography variant="body2">
                  You're viewing simulated data. Click "Retry Connection" to connect to the real API.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {connectionMode === 'demo' && (
            <Button onClick={retryConnection} color="primary">
              Retry Connection
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUrl} variant="contained" color="primary">
            Save & Connect
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
