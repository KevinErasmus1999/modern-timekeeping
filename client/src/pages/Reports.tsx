import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface Shop {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  name: string;
  surname: string;
}

interface ReportFilters {
  startDate: Date;
  endDate: Date;
  shopId?: number;
  employeeId?: number;
  reportType: 'payroll' | 'attendance' | 'overtime';
}

export default function Reports() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    reportType: 'payroll'
  });

  const [shops, setShops] = useState<Shop[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    fetchShopsAndEmployees();
  }, []);

  const fetchShopsAndEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const [shopsRes, employeesRes] = await Promise.all([
        fetch('/api/shops', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!shopsRes.ok || !employeesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const shopsData = await shopsRes.json();
      const employeesData = await employeesRes.json();

      setShops(shopsData);
      setEmployees(employeesData);
    } catch (error) {
      setError('Failed to load setup data');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...filters,
          startDate: format(filters.startDate, 'yyyy-MM-dd'),
          endDate: format(filters.endDate, 'yyyy-MM-dd')
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'excel') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...filters,
          startDate: format(filters.startDate, 'yyyy-MM-dd'),
          endDate: format(filters.endDate, 'yyyy-MM-dd'),
          format
        })
      });

      if (!response.ok) throw new Error('Failed to download report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${filters.reportType}-${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download report');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={500} gutterBottom>
        Reports
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={filters.reportType}
                label="Report Type"
                onChange={(e) => setFilters({
                  ...filters,
                  reportType: e.target.value as ReportFilters['reportType']
                })}
              >
                <MenuItem value="payroll">Payroll Report</MenuItem>
                <MenuItem value="attendance">Attendance Report</MenuItem>
                <MenuItem value="overtime">Overtime Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => date && setFilters({
                  ...filters,
                  startDate: date
                })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => date && setFilters({
                  ...filters,
                  endDate: date
                })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Shop</InputLabel>
              <Select
                value={filters.shopId || ''}
                label="Shop"
                onChange={(e) => setFilters({
                  ...filters,
                  shopId: e.target.value as number
                })}
              >
                <MenuItem value="">All Shops</MenuItem>
                {shops.map((shop) => (
                  <MenuItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={filters.employeeId || ''}
                label="Employee"
                onChange={(e) => setFilters({
                  ...filters,
                  employeeId: e.target.value as number
                })}
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {`${emp.name} ${emp.surname}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading}
              >
                Generate Report
              </Button>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => downloadReport('excel')}
                  disabled={!reportData || loading}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => downloadReport('pdf')}
                  disabled={!reportData || loading}
                >
                  PDF
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : reportData ? (
        <Paper sx={{ p: 3 }}>
          <TableContainer>
            <Typography variant="h6" gutterBottom>
              Report Results
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Regular Hours</TableCell>
                  <TableCell align="right">Overtime Hours</TableCell>
                  <TableCell align="right">Total Pay</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.employees?.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align="right">{row.regularHours?.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.overtimeHours?.toFixed(2)}</TableCell>
                    <TableCell align="right">R{row.totalPay?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {reportData.totals && (
                  <TableRow>
                    <TableCell><strong>Totals</strong></TableCell>
                    <TableCell align="right"><strong>{reportData.totals.regularHours?.toFixed(2)}</strong></TableCell>
                    <TableCell align="right"><strong>{reportData.totals.overtimeHours?.toFixed(2)}</strong></TableCell>
                    <TableCell align="right"><strong>R{reportData.totals.totalPay?.toFixed(2)}</strong></TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : null}
    </Box>
  );
}