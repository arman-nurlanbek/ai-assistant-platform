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
import { GreenAPIIntegration } from '../../types/integration';
import { AIAssistant } from '../../types/assistant';

interface WhatsAppIntegrationFormProps {
  assistants: AIAssistant[];
  onSubmit: (integration: GreenAPIIntegration) => Promise<void>;
  initialData?: Partial<GreenAPIIntegration>;
}

const WhatsAppIntegrationForm: React.FC<WhatsAppIntegrationFormProps> = ({
  assistants,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<GreenAPIIntegration>>(
    initialData || {
      instance_id: '',
      api_token: '',
      assistant_id: '',
      nums: 7105,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(formData as GreenAPIIntegration);
      setSuccess('WhatsApp integration successfully created!');
      if (!initialData) {
        // Clear form if it's a new integration
        setFormData({
          instance_id: '',
          api_token: '',
          assistant_id: '',
          nums: 7105,
        });
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
        {initialData ? 'Edit WhatsApp Integration' : 'New WhatsApp Integration (via GreenAPI)'}
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
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Instance ID"
              name="instance_id"
              value={formData.instance_id || ''}
              onChange={handleInputChange}
              placeholder="Your GreenAPI instance ID"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="API Token"
              name="api_token"
              value={formData.api_token || ''}
              onChange={handleInputChange}
              placeholder="Your GreenAPI token"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="nums"
              type="number"
              value={formData.nums || 7105}
              onChange={handleInputChange}
              helperText="Default: 7105"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? 'Saving...' : 'Save WhatsApp Integration'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default WhatsAppIntegrationForm;