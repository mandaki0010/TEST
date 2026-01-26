import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CalendarToday as CalendarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { employeeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const InfoItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
    <Box sx={{ color: 'primary.main', mr: 2, mt: 0.5 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || '-'}</Typography>
    </Box>
  </Box>
);

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const response = await employeeApi.getById(id);
        setEmployee(response.data);
      } catch (err) {
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeeApi.delete(id);
      navigate('/employees', { replace: true });
    } catch (err) {
      setError('Failed to process retirement');
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box>
        <Alert severity="warning">Employee not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/employees')} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  const fullAddress = [
    employee.postal_code && `〒${employee.postal_code}`,
    employee.prefecture,
    employee.city,
    employee.address_line1,
    employee.address_line2,
  ].filter(Boolean).join(' ');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Employee Details
          </Typography>
        </Box>
        {isAdmin && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/employees/${id}/edit`)}
            >
              Edit
            </Button>
            {employee.employment_status === 'active' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Retire
              </Button>
            )}
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Basic Information</Typography>
                <Chip
                  label={employee.employment_status === 'active' ? 'Active' : 'Retired'}
                  color={employee.employment_status === 'active' ? 'success' : 'default'}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />

              <InfoItem
                icon={<PersonIcon />}
                label="Employee ID"
                value={employee.employee_id}
              />

              <InfoItem
                icon={<PersonIcon />}
                label="Name"
                value={`${employee.last_name} ${employee.first_name}`}
              />

              <InfoItem
                icon={<PersonIcon />}
                label="Furigana"
                value={`${employee.last_name_kana} ${employee.first_name_kana}`}
              />

              <InfoItem
                icon={<BusinessIcon />}
                label="Department"
                value={employee.department_name}
              />

              <InfoItem
                icon={<PersonIcon />}
                label="Position"
                value={employee.position_name}
              />

              <InfoItem
                icon={<PersonIcon />}
                label="Employment Type"
                value={employee.employment_type_name}
              />

              <InfoItem
                icon={<CalendarIcon />}
                label="Hire Date"
                value={employee.hire_date}
              />

              <InfoItem
                icon={<CalendarIcon />}
                label="Birth Date"
                value={employee.birth_date}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>
              <Divider sx={{ mb: 2 }} />

              <InfoItem
                icon={<EmailIcon />}
                label="Email"
                value={employee.email}
              />

              <InfoItem
                icon={<PhoneIcon />}
                label="Phone"
                value={employee.phone}
              />

              <InfoItem
                icon={<HomeIcon />}
                label="Address"
                value={fullAddress || '-'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Retirement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to process retirement for {employee.last_name} {employee.first_name}?
            This action will mark the employee as retired and deactivate their account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : 'Confirm Retirement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDetailPage;
