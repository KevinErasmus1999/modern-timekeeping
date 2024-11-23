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
  TextField,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';

interface Employee {
  id: number;
  name: string;
  hourlyRate: number;
  isActive: boolean;
  shopId?: number;
}

interface Shop {
  id: number;
  name: string;
}

interface FormData {
  name: string;
  hourlyRate: number;
  isActive: boolean;
  shopId: number;
}

const initialFormData: FormData = {
  name: '',
  hourlyRate: 0,
  isActive: true,
  shopId: 0
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShop, setSelectedShop] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchEmployees();
    fetchShops();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, selectedShop, statusFilter]);

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
      setFilteredEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/shops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedShop) {
      filtered = filtered.filter(emp => emp.shopId === selectedShop);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp =>
        statusFilter === 'active' ? emp.isActive : !emp.isActive
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleShopChange = (event: SelectChangeEvent<number>) => {
    setSelectedShop(Number(event.target.value));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingEmployee
        ? `http://localhost:5000/api/employees/${editingEmployee.id}`
        : 'http://localhost:5000/api/employees';

      await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      setOpen(false);
      setEditingEmployee(null);
      setFormData(initialFormData);
      fetchEmployees();
    } catch (error) {
      console.error('Failed to save employee:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      hourlyRate: employee.hourlyRate,
      isActive: employee.isActive,
      shopId: employee.shopId || 0
    });
    setOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Hourly Rate (ZAR)', 'Status', 'Shop'],
      ...filteredEmployees.map(emp => [
        emp.name,
        emp.hourlyRate.toString(),
        emp.isActive ? 'Active' : 'Inactive',
        shops.find(s => s.id === emp.shopId)?.name || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3
      }}>
        <Typography variant="h5" fontWeight={500}>
          Employees
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleExport} title="Export to CSV">
            <ExportIcon />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingEmployee(null);
              setFormData(initialFormData);
              setOpen(true);
            }}
            sx={{
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none' }
            }}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
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
          sx={{ width: 250 }}
        />

        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Shop</InputLabel>
          <Select
            value={selectedShop}
            label="Shop"
            onChange={handleShopChange}
          >
            <MenuItem value={0}>All Shops</MenuItem>
            {shops.map(shop => (
              <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ width: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, borderBottom: 2, borderColor: 'primary.main' }}>
                Name
              </TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: 2, borderColor: 'primary.main' }}>
                Hourly Rate (ZAR)
              </TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: 2, borderColor: 'primary.main' }}>
                Shop
              </TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: 2, borderColor: 'primary.main' }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600, borderBottom: 2, borderColor: 'primary.main' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>R{employee.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>
                    {shops.find(s => s.id === employee.shopId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        backgroundColor: employee.isActive ? 'success.light' : 'error.light',
                        color: employee.isActive ? 'success.dark' : 'error.dark',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontSize: '0.875rem',
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
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(employee.id)}
                      color="error"
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

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingEmployee(null);
          setFormData(initialFormData);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Hourly Rate"
              type="number"
              fullWidth
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
            />
            <FormControl fullWidth>
              <InputLabel>Shop</InputLabel>
              <Select
                value={formData.shopId}
                label="Shop"
                onChange={(e) => setFormData({ ...formData, shopId: Number(e.target.value) })}
              >
                {shops.map(shop => (
                  <MenuItem key={shop.id} value={shop.id}>{shop.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditingEmployee(null);
              setFormData(initialFormData);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {editingEmployee ? 'Update' : 'Add'} Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}