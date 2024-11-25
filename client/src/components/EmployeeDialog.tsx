import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
  Grid,
  Typography,
} from '@mui/material';
import { Male, Female } from '@mui/icons-material';

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: EmployeeFormData) => void;
  initialData?: EmployeeFormData;
  isEditing?: boolean;
}

export interface EmployeeFormData {
  name: string;
  surname: string;
  email: string;
  cellNumber: string;
  idNumber: string;
  gender: 'male' | 'female';
  hourlyRate: number;
  isActive: boolean;
}

const initialFormData: EmployeeFormData = {
  name: '',
  surname: '',
  email: '',
  cellNumber: '',
  idNumber: '',
  gender: 'male',
  hourlyRate: 0,
  isActive: true,
};

export default function EmployeeDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  isEditing = false
}: EmployeeDialogProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(initialData || initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.cellNumber.trim()) newErrors.cellNumber = 'Cell number is required';
    if (!/^(\+27|0)\d{9}$/.test(formData.cellNumber)) {
      newErrors.cellNumber = 'Invalid cell number format';
    }
    if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
    if (!/^\d{13}$/.test(formData.idNumber)) {
      newErrors.idNumber = 'Invalid ID number format';
    }
    if (formData.hourlyRate <= 0) newErrors.hourlyRate = 'Hourly rate must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof EmployeeFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Surname"
                value={formData.surname}
                onChange={handleInputChange('surname')}
                error={!!errors.surname}
                helperText={errors.surname}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cell Number"
                value={formData.cellNumber}
                onChange={handleInputChange('cellNumber')}
                error={!!errors.cellNumber}
                helperText={errors.cellNumber}
                placeholder="0123456789"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Number"
                value={formData.idNumber}
                onChange={handleInputChange('idNumber')}
                error={!!errors.idNumber}
                helperText={errors.idNumber}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hourly Rate (ZAR)"
                type="number"
                value={formData.hourlyRate}
                onChange={handleInputChange('hourlyRate')}
                error={!!errors.hourlyRate}
                helperText={errors.hourlyRate}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Gender</Typography>
              <ToggleButtonGroup
                value={formData.gender}
                exclusive
                onChange={(_, value) => value && setFormData(prev => ({ ...prev, gender: value }))}
              >
                <ToggleButton value="male">
                  <Male sx={{ mr: 1 }} /> Male
                </ToggleButton>
                <ToggleButton value="female">
                  <Female sx={{ mr: 1 }} /> Female
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active Employee"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {isEditing ? 'Update' : 'Add'} Employee
        </Button>
      </DialogActions>
    </Dialog>
  );
}