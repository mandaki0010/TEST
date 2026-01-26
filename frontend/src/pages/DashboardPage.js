import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { employeeApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: `${color}.light`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 32, color: `${color}.main` } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await employeeApi.getStatistics();
        setStats(response.data);
      } catch (err) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats?.total || 0}
            icon={<PeopleIcon />}
            color="primary"
            onClick={() => navigate('/employees')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Employees"
            value={stats?.active || 0}
            icon={<TrendingUpIcon />}
            color="success"
            onClick={() => navigate('/employees?status=active')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Retired"
            value={stats?.retired || 0}
            icon={<PeopleIcon />}
            color="warning"
            onClick={() => navigate('/employees?status=retired')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Departments"
            value={stats?.byDepartment?.length || 0}
            icon={<BusinessIcon />}
            color="secondary"
          />
        </Grid>

        {/* Department Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Employees by Department
              </Typography>
              <List dense>
                {stats?.byDepartment?.map((dept, index) => (
                  <React.Fragment key={dept.department_name}>
                    <ListItem
                      secondaryAction={
                        <Chip label={dept.count} size="small" color="primary" />
                      }
                    >
                      <ListItemText primary={dept.department_name} />
                    </ListItem>
                    {index < stats.byDepartment.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Employment Type Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Employees by Employment Type
              </Typography>
              <List dense>
                {stats?.byEmploymentType?.map((type, index) => (
                  <React.Fragment key={type.type_name}>
                    <ListItem
                      secondaryAction={
                        <Chip label={type.count} size="small" color="secondary" />
                      }
                    >
                      <ListItemText primary={type.type_name} />
                    </ListItem>
                    {index < stats.byEmploymentType.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => navigate('/employees')}>
                  View All Employees
                </Button>
                <Button variant="outlined" onClick={() => navigate('/reports')}>
                  Generate Reports
                </Button>
                {isAdmin && (
                  <>
                    <Button variant="outlined" onClick={() => navigate('/employees/new')}>
                      Add New Employee
                    </Button>
                    <Button variant="outlined" onClick={() => navigate('/import')}>
                      CSV Import
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
