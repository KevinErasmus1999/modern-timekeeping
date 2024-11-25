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
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Store,
  Search as SearchIcon
} from '@mui/icons-material';
import QuickUploadButton from '../components/QuickUploadButton';
import AssignShopDialog from '../components/AssignShopDialog';
import EmployeeDialog from '../components/EmployeeDialog.tsx';

interface Employee {
  id: number;
  name: string;
  surname: string;
  email: string;
  cellNumber: string;
  idNumber: string;
  gender: 'male' | 'female';
  hourlyRate: number;
  isActive: boolean;
  shopId?: number;
  documents?: string[];
  additionalFields?: Record<string, string>;
}

interface FormData {
  name: string;
  surname: string;
  cellNumber: string;
  email: string;
  idNumber: string;
  gender: 'male' | 'female';
  hourlyRate: number;
  isActive: boolean;
  shopId?: number;
  documents: File[];
  additionalFields: Record<string, string>;
}

export default function Employees() {
  // State declarations
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignShopOpen, setAssignShopOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const initialFormData: FormData = {
    name: '',
    surname: '',
    cellNumber: '',
    email: '',
    idNumber: '',
    gender: 'male',
    hourlyRate: 0,
    isActive: true,
    documents: [],
    additionalFields: {}
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchEmployees();
  }, []);

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
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      ...employee,
      documents: [],
      additionalFields: employee.additionalFields || {}
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete employee');

      await fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" fontWeight={500}>
          Employees
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingEmployee(null);
            setFormData(initialFormData);
            setOpen(true);
          }}
        >
          Add Employee
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Rate (ZAR)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No employees found</TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{`${employee.name} ${employee.surname}`}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.cellNumber}</TableCell>
                  <TableCell>R{employee.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        bgcolor: employee.isActive ? 'success.light' : 'error.light',
                        color: employee.isActive ? 'success.dark' : 'error.dark',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                      }}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(employee)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>

                    <QuickUploadButton
                      employeeId={employee.id}
                      onUploadComplete={fetchEmployees}
                      size="small"
                    />

                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setAssignShopOpen(true);
                      }}
                      sx={{ mr: 1 }}
                    >
                      <Store />
                    </IconButton>

                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(employee.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedEmployee && (
        <AssignShopDialog
          open={assignShopOpen}
          onClose={() => {
            setAssignShopOpen(false);
            setSelectedEmployee(null);
          }}
          employeeId={selectedEmployee.id}
          currentShopId={selectedEmployee.shopId}
          onAssigned={fetchEmployees}
        />
      )}
      <EmployeeDialog
  open={open}
  onClose={() => {
    setOpen(false);
    setEditingEmployee(null);
  }}
  onSubmit={async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees';

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save employee');

      setOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to save employee:', error);
    }
  }}
  initialData={editingEmployee ? {
    name: editingEmployee.name,
    surname: editingEmployee.surname,
    email: editingEmployee.email,
    cellNumber: editingEmployee.cellNumber,
    idNumber: editingEmployee.idNumber,
    gender: editingEmployee.gender,
    hourlyRate: editingEmployee.hourlyRate,
    isActive: editingEmployee.isActive
  } : undefined}
  isEditing={!!editingEmployee}
/>
    </Box>
  );
}