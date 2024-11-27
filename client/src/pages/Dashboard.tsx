import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Store as StoreIcon,
  Group as GroupIcon,
  Timer as TimerIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import DashboardFilter, { DateRange } from '../components/DashboardFilter';

interface DashboardData {
  overallStats: {
    totalShops: number;
    totalEmployees: number;
    clockedInEmployees: number;
    overtimeHours: number;
    overtimeAmount: number;
    averageHourlyWage: number;
  };
  lateEmployees: Array<{
    id: number;
    name: string;
    minutesLate: number;
    shop: string;
  }>;
}

const DashboardCard = ({
  icon: Icon,
  title,
  value,
  subValue
}: {
  icon: any;
  title: string;
  value: string | number;
  subValue?: string;
}) => (
  <Card sx={{
    height: '100%',
    boxShadow: 'none',
    border: '1px solid',
    borderColor: 'divider',
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 2 }}>
          <Icon sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          <Typography color="text.secondary">
            {title}
          </Typography>
          {subValue && (
            <Typography variant="body2" color="primary">
              {subValue}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date()
  });

  const fetchDashboardData = async (range: DateRange) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(
        `/api/dashboard?start=${format(range.start, 'yyyy-MM-dd')}&end=${format(range.end, 'yyyy-MM-dd')}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={3}>
        <Typography>No dashboard data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <DashboardFilter onDateRangeChange={handleDateRangeChange} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <DashboardCard
            icon={StoreIcon}
            title="Total Shops"
            value={data.overallStats.totalShops}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard
            icon={GroupIcon}
            title="Total Employees"
            value={data.overallStats.totalEmployees}
            subValue={`${data.overallStats.clockedInEmployees} Currently Working`}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard
            icon={TimerIcon}
            title="Overtime Hours"
            value={data.overallStats.overtimeHours}
            subValue={formatCurrency(data.overallStats.overtimeAmount)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DashboardCard
            icon={MoneyIcon}
            title="Avg. Hourly Rate"
            value={formatCurrency(data.overallStats.averageHourlyWage)}
          />
        </Grid>
      </Grid>

      <Card sx={{
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardHeader
          title="Late Employees Today"
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50'
          }}
        />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee Name</TableCell>
                <TableCell>Shop</TableCell>
                <TableCell>Late Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.lateEmployees.length > 0 ? (
                data.lateEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.shop}</TableCell>
                    <TableCell sx={{ color: 'error.main' }}>
                      {employee.minutesLate} minutes
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No late employees today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Dashboard;