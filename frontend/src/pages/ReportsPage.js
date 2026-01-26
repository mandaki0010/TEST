import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Description as FileIcon,
  TableChart as ExcelIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  AccountTree as OrgIcon,
} from '@mui/icons-material';
import { reportApi, masterApi } from '../services/api';

const reports = [
  {
    id: 'employee_list_excel',
    name: 'Employee List',
    description: 'Export all employees with basic information',
    format: 'Excel',
    icon: <ExcelIcon color="success" />,
    api: 'exportEmployeeListExcel',
    hasFilters: true,
  },
  {
    id: 'employee_list_pdf',
    name: 'Employee List',
    description: 'Export all employees in PDF format',
    format: 'PDF',
    icon: <PdfIcon color="error" />,
    api: 'exportEmployeeListPDF',
    hasFilters: true,
  },
  {
    id: 'department_list',
    name: 'Department List',
    description: 'Export employees grouped by department',
    format: 'Excel',
    icon: <ExcelIcon color="success" />,
    api: 'exportDepartmentListExcel',
    hasFilters: false,
  },
  {
    id: 'organization_chart',
    name: 'Organization Chart',
    description: 'Export organization structure diagram',
    format: 'PDF',
    icon: <OrgIcon color="primary" />,
    api: 'exportOrganizationChartPDF',
    hasFilters: false,
  },
  {
    id: 'active_employees',
    name: 'Active Employees',
    description: 'Export currently active employees only',
    format: 'Excel',
    icon: <ExcelIcon color="success" />,
    api: 'exportActiveEmployeesExcel',
    hasFilters: false,
  },
];

const ReportsPage = () => {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('active');

  // Load departments for filter
  React.useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await masterApi.getDepartments();
        setDepartments(response.data);
      } catch (err) {
        console.error('Failed to load departments');
      }
    };
    loadDepartments();
  }, []);

  const handleDownload = async (report) => {
    setLoading(report.id);
    setError(null);
    setSuccess(null);

    try {
      const params = {};
      if (report.hasFilters) {
        if (selectedDepartment) params.department_id = selectedDepartment;
        params.employment_status = employmentStatus;
      }

      const response = await reportApi[report.api](params);

      // Create download link
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${report.name.toLowerCase().replace(/\s+/g, '_')}.${report.format.toLowerCase()}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`${report.name} downloaded successfully`);
    } catch (err) {
      setError(`Failed to download ${report.name}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Reports
      </Typography>

      {(error || success) && (
        <Alert
          severity={error ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => { setError(null); setSuccess(null); }}
        >
          {error || success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Export Filters</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These filters apply to reports that support filtering (Employee List)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDepartment}
                  label="Department"
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment Status</InputLabel>
                <Select
                  value={employmentStatus}
                  label="Employment Status"
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                >
                  <MenuItem value="active">Active Only</MenuItem>
                  <MenuItem value="retired">Retired Only</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Available Reports</Typography>
          <List>
            {reports.map((report, index) => (
              <ListItem
                key={report.id}
                divider={index < reports.length - 1}
                sx={{ py: 2 }}
              >
                <ListItemIcon>{report.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {report.name}
                      <Typography variant="caption" sx={{ bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1 }}>
                        {report.format}
                      </Typography>
                      {report.hasFilters && (
                        <Typography variant="caption" color="primary">
                          (filterable)
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={report.description}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    startIcon={loading === report.id ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={() => handleDownload(report)}
                    disabled={loading !== null}
                  >
                    Download
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsPage;
