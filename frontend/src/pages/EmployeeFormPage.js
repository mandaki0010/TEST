import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { employeeApi, masterApi } from '../services/api';

const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Master data
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    email: '',
    phone: '',
    birth_date: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line1: '',
    address_line2: '',
    employment_type_id: '',
    employment_status: 'active',
  });

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
        setError('Failed to load master data');
      }
    };
    loadMasterData();
  }, []);

  // Load employee data for edit
  useEffect(() => {
    if (isEdit) {
      const loadEmployee = async () => {
        try {
          const response = await employeeApi.getById(id);
          const emp = response.data;
          setFormData({
            last_name: emp.last_name || '',
            first_name: emp.first_name || '',
            last_name_kana: emp.last_name_kana || '',
            first_name_kana: emp.first_name_kana || '',
            department_id: emp.department_id || '',
            position_id: emp.position_id || '',
            hire_date: emp.hire_date || '',
            email: emp.email || '',
            phone: emp.phone || '',
            birth_date: emp.birth_date || '',
            postal_code: emp.postal_code || '',
            prefecture: emp.prefecture || '',
            city: emp.city || '',
            address_line1: emp.address_line1 || '',
            address_line2: emp.address_line2 || '',
            employment_type_id: emp.employment_type_id || '',
            employment_status: emp.employment_status || 'active',
          });
        } catch (err) {
          setError('Failed to load employee data');
        } finally {
          setLoading(false);
        }
      };
      loadEmployee();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.last_name) newErrors.last_name = 'Required';
    if (!formData.first_name) newErrors.first_name = 'Required';
    if (!formData.last_name_kana) newErrors.last_name_kana = 'Required';
    if (!formData.first_name_kana) newErrors.first_name_kana = 'Required';
    if (!formData.department_id) newErrors.department_id = 'Required';
    if (!formData.hire_date) newErrors.hire_date = 'Required';
    if (!formData.employment_type_id) newErrors.employment_type_id = 'Required';

    // Hiragana check
    if (formData.last_name_kana && !/^[ぁ-んー]+$/.test(formData.last_name_kana)) {
      newErrors.last_name_kana = 'Hiragana only';
    }
    if (formData.first_name_kana && !/^[ぁ-んー]+$/.test(formData.first_name_kana)) {
      newErrors.first_name_kana = 'Hiragana only';
    }

    // Email check
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone check
    if (formData.phone && !/^[\d-]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }

    // Postal code check
    if (formData.postal_code && !/^\d{3}-?\d{4}$/.test(formData.postal_code)) {
      newErrors.postal_code = 'Invalid format (e.g., 123-4567)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);
    setError(null);

    try {
      // Prepare data (convert empty strings to null for optional fields)
      const data = { ...formData };
      ['position_id', 'email', 'phone', 'birth_date', 'postal_code', 'prefecture', 'city', 'address_line1', 'address_line2'].forEach((field) => {
        if (!data[field]) data[field] = null;
      });

      if (isEdit) {
        await employeeApi.update(id, data);
      } else {
        const response = await employeeApi.create(data);
        navigate(`/employees/${response.data.employee_id}`, { replace: true });
        return;
      }

      navigate(`/employees/${id}`, { replace: true });
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to save employee';
      const details = err.response?.data?.details;
      if (details) {
        const fieldErrors = {};
        details.forEach((d) => {
          fieldErrors[d.field] = d.message;
        });
        setErrors(fieldErrors);
      }
      setError(message);
    } finally {
      setSaving(false);
    }
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isEdit ? 'Edit Employee' : 'New Employee'}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      error={!!errors.last_name}
                      helperText={errors.last_name}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      error={!!errors.first_name}
                      helperText={errors.first_name}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="Last Name (Furigana)"
                      name="last_name_kana"
                      value={formData.last_name_kana}
                      onChange={handleChange}
                      error={!!errors.last_name_kana}
                      helperText={errors.last_name_kana || 'Hiragana only'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="First Name (Furigana)"
                      name="first_name_kana"
                      value={formData.first_name_kana}
                      onChange={handleChange}
                      error={!!errors.first_name_kana}
                      helperText={errors.first_name_kana || 'Hiragana only'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required error={!!errors.department_id}>
                      <InputLabel>Department</InputLabel>
                      <Select
                        name="department_id"
                        value={formData.department_id}
                        label="Department"
                        onChange={handleChange}
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept.department_id} value={dept.department_id}>
                            {dept.department_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.department_id && <FormHelperText>{errors.department_id}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Position</InputLabel>
                      <Select
                        name="position_id"
                        value={formData.position_id}
                        label="Position"
                        onChange={handleChange}
                      >
                        <MenuItem value="">None</MenuItem>
                        {positions.map((pos) => (
                          <MenuItem key={pos.position_id} value={pos.position_id}>
                            {pos.position_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      required
                      label="Hire Date"
                      name="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={handleChange}
                      error={!!errors.hire_date}
                      helperText={errors.hire_date}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Birth Date"
                      name="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required error={!!errors.employment_type_id}>
                      <InputLabel>Employment Type</InputLabel>
                      <Select
                        name="employment_type_id"
                        value={formData.employment_type_id}
                        label="Employment Type"
                        onChange={handleChange}
                      >
                        {employmentTypes.map((et) => (
                          <MenuItem key={et.type_id} value={et.type_id}>
                            {et.type_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.employment_type_id && <FormHelperText>{errors.employment_type_id}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  {isEdit && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          name="employment_status"
                          value={formData.employment_status}
                          label="Status"
                          onChange={handleChange}
                        >
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="retired">Retired</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Contact Information</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      error={!!errors.phone}
                      helperText={errors.phone || 'e.g., 090-1234-5678'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Postal Code"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      error={!!errors.postal_code}
                      helperText={errors.postal_code || 'e.g., 123-4567'}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Prefecture"
                      name="prefecture"
                      value={formData.prefecture}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address Line 1"
                      name="address_line1"
                      value={formData.address_line1}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address Line 2"
                      name="address_line2"
                      value={formData.address_line2}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default EmployeeFormPage;
