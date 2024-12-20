import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await res.json();
      login(data.token);
      navigate('/');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      console.error('Login error:', error);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
      <Card sx={{ minWidth: 300, maxWidth: 400, width: '100%', m: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom align="center">
            ZAFinance Login
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              margin="normal"
              label="Email"
              type="email"
              required
              value={credentials.email}
              onChange={e => setCredentials({ ...credentials, email: e.target.value })}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Password"
              type="password"
              required
              value={credentials.password}
              onChange={e => setCredentials({ ...credentials, password: e.target.value })}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}