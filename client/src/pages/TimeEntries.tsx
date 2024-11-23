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
  MenuItem
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

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
}

export default function TimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeEntries();
    fetchEmployees();
  }, []);

  const fetchTimeEntries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/time-entries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setEntries(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleClockIn = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          clockIn: new Date().toISOString()
        })
      });
      setOpen(false);
      setSelectedEmployee(0);
      fetchTimeEntries();
    } catch (error) {
      console.error('Failed to clock in:', error);
    }
  };

  const handleClockOut = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/time-entries/${id}/clock-out`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchTimeEntries();
    } catch (error) {
      console.error('Failed to clock out:', error);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Time Entries
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          sx={{
            textTransform: 'none',
            px: 2,
            py: 1,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            }
          }}
        >
          Clock In
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '25%'
                }}
              >
                Employee
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '25%'
                }}
              >
                Clock In
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '25%'
                }}
              >
                Clock Out
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '15%'
                }}
              >
                Earnings
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '10%'
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="textSecondary">
                    No time entries found. Clock in an employee to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  sx={{
                    '&:last-child td': { border: 0 },
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <TableCell>{entry.employeeName}</TableCell>
                  <TableCell>
                    {new Date(entry.clockIn).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {entry.clockOut
                      ? new Date(entry.clockOut).toLocaleString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    R{entry.earnings.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {!entry.clockOut && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleClockOut(entry.id)}
                        sx={{
                          textTransform: 'none',
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: 'none',
                          }
                        }}
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

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Clock In Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
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
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleClockIn}
            disabled={!selectedEmployee}
            sx={{
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            Clock In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}