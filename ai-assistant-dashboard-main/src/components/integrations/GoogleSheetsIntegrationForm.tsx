import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { GoogleSheetsIntegration } from '../../types/integration';
import { AIAssistant } from '../../types/assistant';

interface GoogleSheetsIntegrationFormProps {
  assistants: AIAssistant[];
  onSubmit: (integration: GoogleSheetsIntegration) => Promise<void>;
  initialData?: Partial<GoogleSheetsIntegration>;
}

const GoogleSheetsIntegrationForm: React.FC<GoogleSheetsIntegrationFormProps> = ({
  assistants,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<GoogleSheetsIntegration>>(
    initialData || {
      spreadsheet_id: '',
      credentials_json: {},
      assistant_id: '',
    }
  );
  const [credentialsString, setCredentialsString] = useState<string>(
    initialData?.credentials_json ? JSON.stringify(initialData.credentials_json, null, 2) : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  // Move these functions inside the component
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentialsString(e.target.value);
    setCredentialsError(null);
    
    try {
      if (e.target.value) {
        const parsedCredentials = JSON.parse(e.target.value);
        setFormData((prev) => ({ ...prev, credentials_json: parsedCredentials }));
      } else {
        setFormData((prev) => ({ ...prev, credentials_json: {} }));
      }
    } catch (err) {
      setCredentialsError('Invalid JSON format');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (credentialsError) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(formData as GoogleSheetsIntegration);
      setSuccess('Google Sheets integration successfully created!');
      if (!initialData) {
        // Clear form if it's a new integration
        setFormData({
          spreadsheet_id: '',
          credentials_json: {},
          assistant_id: '',
        });
        setCredentialsString('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Google Sheets Integration' : 'New Google Sheets Integration'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Spreadsheet ID"
              name="spreadsheet_id"
              value={formData.spreadsheet_id || ''}
              onChange={handleInputChange}
              placeholder="Enter the Google Spreadsheet ID"
              helperText="ID from the spreadsheet URL"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Service Account Credentials (JSON)"
              name="credentials_json"
              value={credentialsString}
              onChange={handleCredentialsChange}
              multiline
              rows={8}
              error={!!credentialsError}
              helperText={credentialsError || "Paste your Google service account credentials JSON here"}
              placeholder='{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "...",
  ...
}'
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Select Assistant</InputLabel>
              <Select
                name="assistant_id"
                value={formData.assistant_id || ''}
                onChange={handleSelectChange}
                label="Select Assistant"
              >
                {assistants.map((assistant) => (
                  <MenuItem key={assistant.assistant_id} value={assistant.assistant_id}>
                    {assistant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading || !!credentialsError}
              sx={{ mt: 2 }}
            >
              {isLoading ? 'Saving...' : 'Save Google Sheets Integration'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default GoogleSheetsIntegrationForm;