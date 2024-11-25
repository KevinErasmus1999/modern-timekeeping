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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FileUpload as FileUploadIcon,
  Visibility as VisibilityIcon,
  Male as MaleIcon,
  Female as FemaleIcon
} from '@mui/icons-material';

interface Employee {
  id: number;
  name: string;
  surname: string;
  cellNumber: string;
  email: string;
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
  shopId: number;
  documents: File[];
  additionalFields: { [key: string]: string };
}

interface Shop {
  id: number;
  name: string;
}

const initialFormData: FormData = {
  name: '',
  surname: '',
  cellNumber: '',
  email: '',
  idNumber: '',
  gender: 'male',
  hourlyRate: 0,
  isActive: true,
  shopId: 0,
  documents: [],
  additionalFields: {}
};

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateCellNumber = (number: string) => {
  return /^(\+27|0)\d{9}$/.test(number);
};

const validateIdNumber = (id: string) => {
  return /^\d{13}$/.test(id);
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [additionalFieldKey, setAdditionalFieldKey] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, statusFilter]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/shops', {
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

    fetchShops();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }

      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch employees');
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.surname.trim()) errors.surname = 'Surname is required';
    if (!formData.cellNumber.trim()) errors.cellNumber = 'Cell number is required';
    else if (!validateCellNumber(formData.cellNumber)) errors.cellNumber = 'Invalid cell number format';

    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!validateEmail(formData.email)) errors.email = 'Invalid email format';

    if (!formData.idNumber.trim()) errors.idNumber = 'ID number is required';
    else if (!validateIdNumber(formData.idNumber)) errors.idNumber = 'Invalid ID number format';

    if (formData.hourlyRate <= 0) errors.hourlyRate = 'Hourly rate must be greater than 0';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      // Append basic fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'additionalFields') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append additional fields
      Object.entries(formData.additionalFields).forEach(([key, value]) => {
        formDataToSend.append(`additionalFields[${key}]`, value);
      });

      // Append documents
      formData.documents.forEach((doc, index) => {
        formDataToSend.append(`documents`, doc);
      });

      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees';

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to save employee');
      }

      setOpen(false);
      setEditingEmployee(null);
      setFormData(initialFormData);
      fetchEmployees();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save employee');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  const addAdditionalField = () => {
    if (additionalFieldKey.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalFields: {
          ...prev.additionalFields,
          [additionalFieldKey]: ''
        }
      }));
      setAdditionalFieldKey('');
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        `${emp.name} ${emp.surname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cellNumber.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp =>
        statusFilter === 'active' ? emp.isActive : !emp.isActive
      );
    }

    setFilteredEmployees(filtered);
  };

  const DocumentDialog = ({
    open,
    onClose,
    employeeId,
    documents,
    mode
  }: {
    open: boolean;
    onClose: () => void;
    employeeId: number;
    documents: string[];
    mode: 'view' | 'upload';
  }) => {
    const [files, setFiles] = useState<File[]>([]);

    const handleUpload = async () => {
      try {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('documents', file);
        });

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/employees/${employeeId}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          onClose();
          fetchEmployees(); // Refresh employee list
        }
      } catch (error) {
        console.error('Failed to upload documents:', error);
      }
    };

    const handleDownload = async (documentName: string) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/employees/documents/${documentName}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = documentName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Failed to download document:', error);
      }
    };

    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'upload' ? 'Upload Documents' : 'View Documents'}
        </DialogTitle>
        <DialogContent>
          {mode === 'upload' ? (
            <Box sx={{ mt: 2 }}>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Box sx={{ mt: 2 }}>
                {files.map((file, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    {file.name}
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <List>
              {documents.map((doc, index) => (
                <ListItem key={index}>
                  <ListItemText primary={doc} />
                  <IconButton onClick={() => handleDownload(doc)}>
                    <FileDownloadIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          {mode === 'upload' && (
            <Button onClick={handleUpload} variant="contained">
              Upload
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  // Update your table actions cell:
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
      sx={{ mr: 1 }}
    >
      <DeleteIcon />
    </IconButton>
    <IconButton
      size="small"
      onClick={() => {
        setSelectedEmployee(employee);
        setDocumentDialogMode('upload');
        setDocumentDialogOpen(true);
      }}
      color="primary"
      sx={{ mr: 1 }}
    >
      <FileUploadIcon />
    </IconButton>
    <IconButton
      size="small"
      onClick={() => {
        setSelectedEmployee(employee);
        setDocumentDialogMode('view');
        setDocumentDialogOpen(true);
      }}
      color="primary"
    >
      <VisibilityIcon />
    </IconButton>
  </TableCell>

  return (
    <Box sx={{ width: '100%' }}>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Cell Number</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Hourly Rate (ZAR)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{`${employee.name} ${employee.surname}`}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.cellNumber}</TableCell>
                  <TableCell>
                    {employee.gender === 'male' ? <MaleIcon /> : <FemaleIcon />}
                  </TableCell>
                  <TableCell>R{employee.hourlyRate.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        backgroundColor: employee.isActive ? 'success.light' : 'error.light',
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
                      onClick={() => {
                        setEditingEmployee(employee);
                        setFormData({
                          ...employee,
                          documents: [],
                          additionalFields: employee.additionalFields || {}
                        });
                        setOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this employee?')) {
                          // Handle delete
                        }
                      }}
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
          setFormErrors({});
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
              <TextField
                label="Surname"
                fullWidth
                value={formData.surname}
                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                error={!!formErrors.surname}
                helperText={formErrors.surname}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                label="Cell Number"
                fullWidth
                value={formData.cellNumber}
                onChange={(e) => setFormData({ ...formData, cellNumber: e.target.value })}
                error={!!formErrors.cellNumber}
                helperText={formErrors.cellNumber}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="ID Number"
                fullWidth
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                error={!!formErrors.idNumber}
                helperText={formErrors.idNumber}
              />
              <TextField
                label="Hourly Rate (ZAR)"
                type="number"
                fullWidth
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                error={!!formErrors.hourlyRate}
                helperText={formErrors.hourlyRate}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography>Gender:</Typography>
              <ToggleButtonGroup
                value={formData.gender}
                exclusive
                onChange={(_, value) => value && setFormData({ ...formData, gender: value })}
              >
                <ToggleButton value="male">
                  <MaleIcon sx={{ mr: 1 }} /> Male
                </ToggleButton>
                <ToggleButton value="female">
                  <FemaleIcon sx={{ mr: 1 }} /> Female
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Document Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Documents
              </Typography>
              <Box sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}>
                <input
                  type="file"
                  multiple
                  id="document-upload"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="document-upload">
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FileUploadIcon sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="body1">
                      Drag & drop files here or click to browse
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Supported formats: PDF, DOC, DOCX, JPG, PNG
                    </Typography>
                  </Box>
                </label>
              </Box>
              {formData.documents.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Files:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {formData.documents.map((file, index) => (
                      <Box
                        key={index}
                        component="li"
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 0.5
                        }}
                      >
                        <Typography variant="body2">{file.name}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const newDocs = [...formData.documents];
                            newDocs.splice(index, 1);
                            setFormData({ ...formData, documents: newDocs });
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            {/* Additional Fields Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Additional Fields
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  size="small"
                  label="Field Name"
                  value={additionalFieldKey}
                  onChange={(e) => setAdditionalFieldKey(e.target.value)}
                />
                <Button
                  variant="outlined"
                  onClick={addAdditionalField}
                  disabled={!additionalFieldKey.trim()}
                >
                  Add Field
                </Button>
              </Box>
              {Object.entries(formData.additionalFields).map(([key, value]) => (
                <Box key={key} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={key}
                    value={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      additionalFields: {
                        ...formData.additionalFields,
                        [key]: e.target.value
                      }
                    })}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newFields = { ...formData.additionalFields };
                      delete newFields[key];
                      setFormData({
                        ...formData,
                        additionalFields: newFields
                      });
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditingEmployee(null);
              setFormData(initialFormData);
              setFormErrors({});
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {editingEmployee ? 'Update' : 'Add'} Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}