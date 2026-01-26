import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Save as SaveIcon, Lock as LockIcon } from '@mui/icons-material';
import { employeeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const MyPage = () => {
  const { user, changePassword } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Profile form
  const [profile, setProfile] = useState({
    email: '',
    phone: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line1: '',
    address_line2: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await employeeApi.getMyInfo();
        const data = response.data;
        setProfile({
          email: data.email || '',
          phone: data.phone || '',
          postal_code: data.postal_code || '',
          prefecture: data.prefecture || '',
          city: data.city || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
        });
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await employeeApi.updateMyInfo(profile);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setError(null);
    setSuccess(null);

    // Validate
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Required';
    if (!passwordForm.newPassword) errors.newPassword = 'Required';
    if (passwordForm.newPassword && passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Must be at least 8 characters';
    }
    if (passwordForm.newPassword && !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(passwordForm.newPassword)) {
      errors.newPassword = 'Must contain letters, numbers, and symbols';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSaving(true);

    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);

    if (result.success) {
      setSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setError(result.error);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        My Page
      </Typography>

      {/* User Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Account Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Name</Typography>
              <Typography variant="body1">{user?.lastName} {user?.firstName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Username</Typography>
              <Typography variant="body1">{user?.username}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Employee ID</Typography>
              <Typography variant="body1">{user?.employeeId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Department</Typography>
              <Typography variant="body1">{user?.departmentName}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {(error || success) && (
        <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => { setError(null); setSuccess(null); }}>
          {error || success}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Edit Profile" />
            <Tab label="Change Password" />
          </Tabs>

          {tab === 0 && (
            <form onSubmit={handleProfileSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Address</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    name="postal_code"
                    value={profile.postal_code}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Prefecture"
                    name="prefecture"
                    value={profile.prefecture}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={profile.city}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 1"
                    name="address_line1"
                    value={profile.address_line1}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address Line 2"
                    name="address_line2"
                    value={profile.address_line2}
                    onChange={handleProfileChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={saving}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}

          {tab === 1 && (
            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2} sx={{ maxWidth: 400 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword || 'At least 8 characters with letters, numbers, and symbols'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <LockIcon />}
                    disabled={saving}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MyPage;
