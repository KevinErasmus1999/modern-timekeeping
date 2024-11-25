import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Link
} from '@mui/material';
import {
  People,
  Store,
  AccessTime,
  Visibility
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  shops: {
    id: number;
    name: string;
    totalEmployees: number;
    clockedInEmployees: number;
    averageWage: number;
    monthlyHours: {
      date: string;
      hours: number;
      wages: number;
    }[];
  }[];
  overallStats: {
    totalShops: number;
    totalEmployees: number;
    clockedInEmployees: number;
    averageHourlyWage: number;
  };
  wageDistribution: {
    range: string;
    count: number;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Overall Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <Store sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.overallStats.totalShops}
              </Typography>
              <Typography color="textSecondary">Total Shops</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <People sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.overallStats.totalEmployees}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.overallStats.clockedInEmployees} Currently Working
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <AccessTime sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                R{stats.overallStats.averageHourlyWage}
              </Typography>
              <Typography color="textSecondary">Avg. Hourly Rate</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Wage Distribution Chart */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Wage Distribution</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={stats.wageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Shop Cards */}
      <Grid container spacing={3}>
        {stats.shops.map((shop) => (
          <Grid item xs={12} md={4} key={shop.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Typography variant="h6" gutterBottom>
                    {shop.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/shops/${shop.id}`)}
                  >
                    <Visibility />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Employees: {shop.clockedInEmployees}/{shop.totalEmployees} Active
                </Typography>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Avg. Wage: R{shop.averageWage}/hr
                </Typography>

                <Box sx={{ height: 200, mt: 2 }}>
                  <ResponsiveContainer>
                    <LineChart data={shop.monthlyHours}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="hours" stroke="#8884d8" />
                      <Line type="monotone" dataKey="wages" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}