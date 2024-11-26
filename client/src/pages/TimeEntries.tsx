import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { Add as AddIcon, AccessTime } from '@mui/icons-material';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';

interface TimeEntry {
  id: number;
  employeeId: number;
  employeeName: string;
  clockIn: string;
  clockOut: string | null;
  earnings: number;
}

interface Employee {
  id: number;
  name: string;
  surname: string;
  isActive: boolean;
  hourlyRate: number;
}

export default function TimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-entries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch time entries');

      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch employees');

      const data = await response.json();
      setEmployees(data.filter((emp: Employee) => emp.isActive));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchTimeEntries(), fetchEmployees()])
      .finally(() => setLoading(false));

    const interval = setInterval(fetchTimeEntries, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = async () => {
    try {
      if (!selectedEmployee) {
        setError('Please select an employee');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId: selectedEmployee })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clock in');
      }

      await fetchTimeEntries();
      setOpen(false);
      setSelectedEmployee(0);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clock in');
    }
  };

  const handleClockOut = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/time-entries/${id}/clock-out`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clock out');
      }

      await fetchTimeEntries();
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to clock out');
    }
  };

  const formatDuration = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    return formatDistanceToNow(start, { addSuffix: true });
  };

  const isAlreadyClockedIn = (employeeId: number) => {
    return entries.some(entry => entry.employeeId === employeeId && !entry.clockOut);
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" fontWeight="500">
          Time Entries
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Clock In
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Clock In</TableCell>
              <TableCell>Clock Out</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Earnings (ZAR)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No time entries found
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.employeeName}</TableCell>
                  <TableCell>
                    {new Date(entry.clockIn).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {entry.clockOut ?
                      new Date(entry.clockOut).toLocaleString() :
                      'Currently Working'
                    }
                  </TableCell>
                  <TableCell>
                    {formatDuration(entry.clockIn, entry.clockOut)}
                  </TableCell>
                  <TableCell>
                    R{entry.earnings.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {!entry.clockOut && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleClockOut(entry.id)}
                        startIcon={<AccessTime />}
                      >
                        Clock Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clock In Employee</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Employee</InputLabel>
            <Select
              value={selectedEmployee}
              label="Select Employee"
              onChange={(e) => setSelectedEmployee(Number(e.target.value))}
            >
              <MenuItem value={0} disabled>
                Select an employee
              </MenuItem>
              {employees.map((employee) => (
                <MenuItem
                  key={employee.id}
                  value={employee.id}
                  disabled={isAlreadyClockedIn(employee.id)}
                >
                  {`${employee.name} ${employee.surname}`}
                  {isAlreadyClockedIn(employee.id) && ' (Already clocked in)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleClockIn}
            disabled={!selectedEmployee}
          >
            Clock In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}