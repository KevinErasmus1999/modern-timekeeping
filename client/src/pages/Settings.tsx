import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { parseISO, format } from 'date-fns';
import { Save as SaveIcon, RestartAlt as ResetIcon } from '@mui/icons-material';

interface Settings {
  id?: number;
  payrollStartDay: number;
  payrollEndDay: number;
  workDayStartTime: string;
  workDayEndTime: string;
  overtimeRate: number;
  weekendRate: number;
  holidayRate: number;
  holidays: Array<{ date: string; name: string; }>;
}

const defaultSettings: Settings = {
  payrollStartDay: 25,
  payrollEndDay: 24,
  workDayStartTime: '08:00',
  workDayEndTime: '17:00',
  overtimeRate: 1.5,
  weekendRate: 2.0,
  holidayRate: 2.5,
  holidays: [
    { date: '2024-01-01', name: "New Year's Day" },
    { date: '2024-03-21', name: 'Human Rights Day' },
    { date: '2024-04-19', name: 'Good Friday' },
    { date: '2024-04-22', name: 'Family Day' },
    { date: '2024-04-27', name: 'Freedom Day' },
    { date: '2024-05-01', name: 'Workers Day' },
    { date: '2024-06-16', name: 'Youth Day' },
    { date: '2024-08-09', name: "National Women's Day" },
    { date: '2024-09-24', name: 'Heritage Day' },
    { date: '2024-12-16', name: 'Day of Reconciliation' },
    { date: '2024-12-25', name: 'Christmas Day' },
    { date: '2024-12-26', name: 'Day of Goodwill' }
  ]
};

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data || defaultSettings);
    } catch (error) {
      console.error('Settings fetch error:', error);
      setError('Failed to load settings');
      setSettings(defaultSettings); // Fallback to default settings
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
      await fetchSettings(); // Refresh settings after save
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default settings?')) {
      setSettings(defaultSettings);
    }
  };

  const handleTimeChange = (field: 'workDayStartTime' | 'workDayEndTime', value: Date | null) => {
    if (!settings || !value) return;

    setSettings({
      ...settings,
      [field]: format(value, 'HH:mm')
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={500}>
          System Settings
        </Typography>
        <IconButton
          onClick={handleReset}
          title="Reset to defaults"
          color="primary"
        >
          <ResetIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Settings saved successfully
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payroll Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Payroll Start Day"
              type="number"
              value={settings.payrollStartDay}
              onChange={(e) => setSettings({
                ...settings,
                payrollStartDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
              })}
              inputProps={{ min: 1, max: 31 }}
              helperText="Day of the month when payroll period starts"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Payroll End Day"
              type="number"
              value={settings.payrollEndDay}
              onChange={(e) => setSettings({
                ...settings,
                payrollEndDay: Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
              })}
              inputProps={{ min: 1, max: 31 }}
              helperText="Day of the month when payroll period ends"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, mb: 2 }}>
          <Divider />
        </Box>

        <Typography variant="h6" gutterBottom>
          Working Hours
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="Work Day Start Time"
                value={parseISO(`2023-01-01T${settings.workDayStartTime}`)}
                onChange={(newValue) => handleTimeChange('workDayStartTime', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Start time of standard work day'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <TimePicker
                label="Work Day End Time"
                value={parseISO(`2023-01-01T${settings.workDayEndTime}`)}
                onChange={(newValue) => handleTimeChange('workDayEndTime', newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'End time of standard work day'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, mb: 2 }}>
          <Divider />
        </Box>

        <Typography variant="h6" gutterBottom>
          Rate Multipliers
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Overtime Rate"
              type="number"
              value={settings.overtimeRate}
              onChange={(e) => setSettings({
                ...settings,
                overtimeRate: Math.max(1, parseFloat(e.target.value) || 1)
              })}
              inputProps={{ min: 1, step: 0.1 }}
              helperText="Multiplier for overtime hours"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Weekend Rate"
              type="number"
              value={settings.weekendRate}
              onChange={(e) => setSettings({
                ...settings,
                weekendRate: Math.max(1, parseFloat(e.target.value) || 1)
              })}
              inputProps={{ min: 1, step: 0.1 }}
              helperText="Multiplier for weekend hours"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Holiday Rate"
              type="number"
              value={settings.holidayRate}
              onChange={(e) => setSettings({
                ...settings,
                holidayRate: Math.max(1, parseFloat(e.target.value) || 1)
              })}
              inputProps={{ min: 1, step: 0.1 }}
              helperText="Multiplier for public holiday hours"
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Public Holidays (2024)
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Holiday</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settings.holidays
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((holiday) => (
                  <TableRow key={holiday.date}>
                    <TableCell>
                      {format(parseISO(holiday.date), 'MMMM d, yyyy')}
                    </TableCell>
                    <TableCell>{holiday.name}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={<SaveIcon />}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}