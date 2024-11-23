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
  TextField
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface Shop {
  id: number;
  name: string;
  address: string;
  employeeCount: number;
  isActive: boolean;
}

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  useEffect(() => {
    fetchShops();
  }, []);

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
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      setOpen(false);
      setFormData({ name: '', address: '' });
      fetchShops();
    } catch (error) {
      console.error('Failed to add shop:', error);
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
          Shops
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
          Add Shop
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
                  width: '30%'
                }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '40%'
                }}
              >
                Address
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '15%'
                }}
              >
                Employees
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  borderBottom: 2,
                  borderColor: 'primary.main',
                  width: '15%'
                }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8 }}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="textSecondary">
                    No shops found. Add your first shop to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              shops.map((shop) => (
                <TableRow
                  key={shop.id}
                  sx={{
                    '&:last-child td': { border: 0 },
                    '&:hover': { backgroundColor: 'action.hover' },
                  }}
                >
                  <TableCell>{shop.name}</TableCell>
                  <TableCell>{shop.address}</TableCell>
                  <TableCell>{shop.employeeCount}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        backgroundColor: shop.isActive ? 'success.light' : 'error.light',
                        color: shop.isActive ? 'success.dark' : 'error.dark',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        fontSize: '0.875rem',
                      }}
                    >
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </Box>
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
        <DialogTitle>Add New Shop</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Shop Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
            onClick={handleSubmit}
            sx={{
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            Add Shop
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}