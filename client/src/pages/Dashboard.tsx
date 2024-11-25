import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  People,
  AttachMoney,
  TrendingUp,
  AccessTime,
  Warning,
  CheckCircle,
  Store as StoreIcon,
  Timer,
  Group,
  MonetizationOn
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
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalShops: number;
  averageHourlyRate: number;
  totalMonthlyHours: number;
  totalMonthlyWages: number;
  employeesByShop: {
    shopName: string;
    employeeCount: number;
  }[];
  attendanceStats: {
    present: number;
    absent: number;
    late: number;
  };
  monthlyStats: {
    month: string;
    totalHours: number;
    wages: number;
    attendance: number;
  }[];
  shopPerformance: {
    shopName: string;
    totalHours: number;
    employeeCount: number;
    totalWages: number;
    efficiency: number;
  }[];
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('month');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashboard?range=${dateRange}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="info">No data available</Alert>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Business Overview
        </Typography>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={dateRange} label="Time Range" onChange={(e) => setDateRange(e.target.value)}>
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Group sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ ml: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Total Employees
                </Typography>
                <Typography variant="h4">{stats.totalEmployees}</Typography>
              </Box>
            </Box>
            <Typography color="success.main" variant="body2">
              {stats.activeEmployees} Active
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Timer sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ ml: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Monthly Hours
                </Typography>
                <Typography variant="h4">{stats.totalMonthlyHours}</Typography>
              </Box>
            </Box>
            <Typography color="info.main" variant="body2">
              Avg {(stats.totalMonthlyHours / stats.activeEmployees).toFixed(1)} hrs/employee
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MonetizationOn sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ ml: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Monthly Wages
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(stats.totalMonthlyWages)}
                </Typography>
              </Box>
            </Box>
            <Typography color="info.main" variant="body2">
              Avg {formatCurrency(stats.averageHourlyRate)}/hr
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <StoreIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box sx={{ ml: 2 }}>
                <Typography color="textSecondary" variant="body2">
                  Active Stores
                </Typography>
                <Typography variant="h4">{stats.totalShops}</Typography>
              </Box>
            </Box>
            <Typography variant="body2">
              {(stats.totalEmployees / stats.totalShops).toFixed(1)} employees/store
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Attendance Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Today's Attendance
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Present', value: stats.attendanceStats.present },
                      { name: 'Absent', value: stats.attendanceStats.absent },
                      { name: 'Late', value: stats.attendanceStats.late }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Performance
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={stats.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="totalHours"
                    stroke="#8884d8"
                    name="Hours"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="wages"
                    stroke="#82ca9d"
                    name="Wages"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Shop Performance */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Shop Performance
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={stats.shopPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shopName" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="totalHours" fill="#8884d8" name="Hours" />
              <Bar yAxisId="right" dataKey="totalWages" fill="#82ca9d" name="Wages" />
              <Bar yAxisId="left" dataKey="efficiency" fill="#ffc658" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}