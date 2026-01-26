import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { importApi } from '../services/api';

const CSVImportPage = () => {
  const fileInputRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const steps = ['Select File', 'Upload & Validate', 'Results'];

  const handleDownloadTemplate = async () => {
    try {
      const response = await importApi.getTemplate();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setActiveStep(1);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const response = await importApi.uploadCSV(file);
      setResult(response.data);
      setActiveStep(2);
    } catch (err) {
      const data = err.response?.data;
      if (data?.details) {
        setResult({
          error: true,
          message: data.error,
          errorCount: data.errorCount,
          details: data.details,
        });
        setActiveStep(2);
      } else {
        setError(data?.error || 'Failed to upload CSV');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setActiveStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        CSV Import
      </Typography>

      {/* Progress Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step 1: File Selection */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Download Template</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              First, download the CSV template and fill in the employee data.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              sx={{ mb: 4 }}
            >
              Download Template
            </Button>

            <Typography variant="h6" gutterBottom>Required Fields</Typography>
            <List dense>
              {['Last Name', 'First Name', 'Last Name (Furigana)', 'First Name (Furigana)', 'Department', 'Hire Date', 'Employment Type'].map((field) => (
                <ListItem key={field}>
                  <ListItemIcon><InfoIcon color="primary" fontSize="small" /></ListItemIcon>
                  <ListItemText primary={field} />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Select CSV File</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Selected File</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <UploadIcon color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">{file?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file?.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
              <Button size="small" onClick={handleReset}>
                Change
              </Button>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
              >
                {loading ? 'Uploading...' : 'Upload & Import'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {activeStep === 2 && result && (
        <Card>
          <CardContent>
            {result.error ? (
              <>
                <Alert severity="error" sx={{ mb: 3 }}>
                  {result.message} ({result.errorCount} errors found)
                </Alert>
                <Typography variant="h6" gutterBottom>Validation Errors</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Errors</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.details?.slice(0, 20).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.row}</TableCell>
                          <TableCell>
                            {item.errors.map((err, i) => (
                              <Chip
                                key={i}
                                label={err}
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {result.details?.length > 20 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Showing first 20 errors of {result.errorCount}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Alert
                  severity="success"
                  icon={<SuccessIcon />}
                  sx={{ mb: 3 }}
                >
                  Import completed successfully!
                </Alert>
                <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
                  <Box>
                    <Typography variant="h4" color="success.main">{result.success}</Typography>
                    <Typography variant="body2" color="text.secondary">Employees imported</Typography>
                  </Box>
                  {result.failed > 0 && (
                    <Box>
                      <Typography variant="h4" color="error.main">{result.failed}</Typography>
                      <Typography variant="body2" color="text.secondary">Failed</Typography>
                    </Box>
                  )}
                </Box>
                {result.employees?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Imported Employee IDs:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {result.employees.slice(0, 20).map((id) => (
                        <Chip key={id} label={id} size="small" variant="outlined" />
                      ))}
                      {result.employees.length > 20 && (
                        <Chip label={`+${result.employees.length - 20} more`} size="small" />
                      )}
                    </Box>
                  </>
                )}
              </>
            )}

            <Box sx={{ mt: 4 }}>
              <Button variant="contained" onClick={handleReset}>
                Import Another File
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CSVImportPage;
