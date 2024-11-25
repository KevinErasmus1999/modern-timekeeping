import React, { useRef, useState } from 'react';
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  LinearProgress,
  Alert
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';

interface QuickUploadButtonProps {
  employeeId: number;
  onUploadComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function QuickUploadButton({ employeeId, onUploadComplete, size = 'small' }: QuickUploadButtonProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    try {
      setUploading(true);
      setError('');
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

      if (!response.ok) throw new Error('Upload failed');

      setFiles([]);
      setOpen(false);
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      setError('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        size={size}
        color="primary"
        title="Quick Upload"
      >
        <CloudUpload />
      </IconButton>

      <Dialog open={open} onClose={() => !uploading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quick Document Upload</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography>
              Drop files here or click to browse
            </Typography>
          </Box>

          {files.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
                p: 1,
                bgcolor: 'background.default',
                borderRadius: 1
              }}
            >
              <Typography noWrap sx={{ maxWidth: '80%' }}>
                {file.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <Close />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}