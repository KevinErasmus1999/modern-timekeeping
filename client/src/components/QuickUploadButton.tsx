import React, { useRef, useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!files.length) return;

    try {
      setUploading(true);
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
      setError('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <IconButton onClick={() => setOpen(true)} size={size}>
        <CloudUpload />
      </IconButton>

      <Dialog open={open} onClose={() => !uploading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Documents</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 3,
              mb: 2,
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              hidden
              multiple
              onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
            />
            <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography>Drop files here or click to browse</Typography>
          </Box>

          {files.map((file, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 1,
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1
              }}
            >
              <Typography noWrap>{file.name}</Typography>
              <IconButton
                size="small"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                disabled={uploading}
              >
                <Close />
              </IconButton>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !files.length}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}