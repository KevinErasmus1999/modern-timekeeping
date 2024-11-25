import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';

interface Shop {
  id: number;
  name: string;
}

interface AssignShopDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId: number;
  currentShopId?: number;
  onAssigned?: () => void;
}

export default function AssignShopDialog({
  open,
  onClose,
  employeeId,
  currentShopId,
  onAssigned
}: AssignShopDialogProps) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<number>(currentShopId || 0);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchShops();
      setSelectedShop(currentShopId || 0);
    }
  }, [open, currentShopId]);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/shops', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch shops');

      const data = await response.json();
      setShops(data);
    } catch (error) {
      setError('Failed to fetch shops');
    }
  };

  const handleAssign = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/employees/${employeeId}/assign-shop`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shopId: selectedShop || null })
      });

      if (!response.ok) throw new Error('Failed to assign shop');

      if (onAssigned) onAssigned();
      onClose();
    } catch (error) {
      setError('Failed to assign shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign to Shop</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Shop</InputLabel>
          <Select
            value={selectedShop}
            label="Select Shop"
            onChange={(e) => setSelectedShop(Number(e.target.value))}
          >
            <MenuItem value={0}>No Shop</MenuItem>
            {shops.map((shop) => (
              <MenuItem key={shop.id} value={shop.id}>
                {shop.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Assigning...' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}