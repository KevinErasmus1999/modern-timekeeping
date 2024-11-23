import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  People,
  AccessTime,
  AttachMoney,
  TrendingUp,
  Store
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalHoursToday: number;
  totalEarningsToday: number;
  averageHourlyRate: number;
  totalShops: number;
}

interface TimeEntry {
  date: string;
  hours: number;
  earnings: number;
}

interface TopEmployee {
  name: string;
  hours: number;
  earnings: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalHoursToday: 0,
    totalEarningsToday: 0,
    averageHourlyRate: 0,
    totalShops: 0
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [topEmployees, setTopEmployees] = useState<TopEmployee[]>([]);
  const [dateRange, setDateRange] = useState('week'); // week, month, year
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/dashboard?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStats(data.stats);
      setTimeEntries(data.timeEntries);
      setTopEmployees(data.topEmployees);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none'
      }}
    >
      <Box
        sx={{
          backgroundColor: `${color}15`,
          p: 1.5,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon sx={{ fontSize: 30, color }} />
      </Box>
      <Box>
        <Typography color="textSecondary" variant="body2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4
      }}>
        <Typography variant="h5" fontWeight={500}>
          Dashboard
        </Typography>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={dateRange}
            label="Time Range"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={People}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Hours Today"
            value={`${stats.totalHoursToday.toFixed(1)}h`}
            icon={AccessTime}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Earnings Today"
            value={`R${stats.totalEarningsToday.toFixed(2)}`}
            icon={AttachMoney}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg. Hourly Rate"
            value={`R${stats.averageHourlyRate.toFixed(2)}`}
            icon={TrendingUp}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Hours & Earnings Trend
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeEntries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="hours"
                    stroke="#1976d2"
                    name="Hours"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="earnings"
                    stroke="#2e7d32"
                    name="Earnings (R)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Top Performing Employees
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEmployees} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#1976d2" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}