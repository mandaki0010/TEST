import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { employeeApi, masterApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EmployeeListPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);

  // Filters
  const [name, setName] = useState(searchParams.get('name') || '');
  const [departmentId, setDepartmentId] = useState(searchParams.get('department') || '');
  const [positionId, setPositionId] = useState(searchParams.get('position') || '');
  const [employmentStatus, setEmploymentStatus] = useState(searchParams.get('status') || 'active');
  const [employmentTypeId, setEmploymentTypeId] = useState(searchParams.get('type') || '');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);

  // Sort
  const [sortBy, setSortBy] = useState('last_name_kana');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Load master data
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [deptRes, posRes, etRes] = await Promise.all([
          masterApi.getDepartments(),
          masterApi.getPositions(),
          masterApi.getEmploymentTypes(),
        ]);
        setDepartments(deptRes.data);
        setPositions(posRes.data);
        setEmploymentTypes(etRes.data);
      } catch (err) {
        console.error('Failed to load master data:', err);
      }
    };
    loadMasterData();
  }, []);

  // Load employees
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        employment_status: employmentStatus,
      };
      if (name) params.name = name;
      if (departmentId) params.department_id = departmentId;
      if (positionId) params.position_id = positionId;
      if (employmentTypeId) params.employment_type_id = employmentTypeId;

      const response = await employeeApi.getAll(params);
      setEmployees(response.data.data);
      setTotal(response.data.pagination.total);
    } catch (err) {
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, sortBy, sortOrder, name, departmentId, positionId, employmentStatus, employmentTypeId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleSearch = () => {
    setPage(0);
    loadEmployees();
  };

  const handleClearFilters = () => {
    setName('');
    setDepartmentId('');
    setPositionId('');
    setEmploymentStatus('active');
    setEmploymentTypeId('');
    setPage(0);
    setSearchParams({});
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Employees
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/employees/new')}
          >
            Add Employee
          </Button>
        )}
      </Box>

      {/* Search Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Name Search"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={departmentId}
                  label="Department"
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Position</InputLabel>
                <Select
                  value={positionId}
                  label="Position"
                  onChange={(e) => setPositionId(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {positions.map((pos) => (
                    <MenuItem key={pos.position_id} value={pos.position_id}>
                      {pos.position_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={employmentStatus}
                  label="Status"
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                  <MenuItem value="all">All</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={employmentTypeId}
                  label="Employment Type"
                  onChange={(e) => setEmploymentTypeId(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {employmentTypes.map((et) => (
                    <MenuItem key={et.type_id} value={et.type_id}>
                      {et.type_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 'auto' }}>
                  <SearchIcon />
                </Button>
                <Button variant="outlined" onClick={handleClearFilters} sx={{ minWidth: 'auto' }}>
                  <ClearIcon />
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Employee Table */}
      <Card>
        <TableContainer component={Paper}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'employee_id'}
                        direction={sortBy === 'employee_id' ? sortOrder.toLowerCase() : 'asc'}
                        onClick={() => handleSort('employee_id')}
                      >
                        ID
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortBy === 'last_name_kana'}
                        direction={sortBy === 'last_name_kana' ? sortOrder.toLowerCase() : 'asc'}
                        onClick={() => handleSort('last_name_kana')}
                      >
                        Name
                      </TableSortLabel>
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'department_id'}
                            direction={sortBy === 'department_id' ? sortOrder.toLowerCase() : 'asc'}
                            onClick={() => handleSort('department_id')}
                          >
                            Department
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>
                          <TableSortLabel
                            active={sortBy === 'hire_date'}
                            direction={sortBy === 'hire_date' ? sortOrder.toLowerCase() : 'asc'}
                            onClick={() => handleSort('hire_date')}
                          >
                            Hire Date
                          </TableSortLabel>
                        </TableCell>
                        <TableCell>Status</TableCell>
                      </>
                    )}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow
                        key={employee.employee_id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/employees/${employee.employee_id}`)}
                      >
                        <TableCell>{employee.employee_id}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {employee.last_name} {employee.first_name}
                            </Typography>
                            {isMobile && (
                              <Typography variant="caption" color="text.secondary">
                                {employee.department_name}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        {!isMobile && (
                          <>
                            <TableCell>{employee.department_name}</TableCell>
                            <TableCell>{employee.position_name || '-'}</TableCell>
                            <TableCell>{employee.hire_date}</TableCell>
                            <TableCell>
                              <Chip
                                label={employee.employment_status === 'active' ? 'Active' : 'Retired'}
                                color={employee.employment_status === 'active' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employees/${employee.employee_id}`);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                          {isAdmin && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/employees/${employee.employee_id}/edit`);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Rows:"
              />
            </>
          )}
        </TableContainer>
      </Card>
    </Box>
  );
};

export default EmployeeListPage;
