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
import { TelegramIntegration } from '../../types/integration';
import { AIAssistant } from '../../types/assistant';

interface TelegramIntegrationFormProps {
  assistants: AIAssistant[];
  onSubmit: (integration: TelegramIntegration) => Promise<void>;
  initialData?: Partial<TelegramIntegration>;
}

const TelegramIntegrationForm: React.FC<TelegramIntegrationFormProps> = ({
  assistants,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<TelegramIntegration>>(
    initialData || {
      bot_token: '',
      webhook_url: '',
      assistant_id: '',
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
      await onSubmit(formData as TelegramIntegration);
      setSuccess('Telegram integration successfully created!');
      if (!initialData) {
        // Clear form if it's a new integration
        setFormData({
          bot_token: '',
          webhook_url: '',
          assistant_id: '',
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
        {initialData ? 'Edit Telegram Integration' : 'New Telegram Integration'}
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
              label="Bot Token"
              name="bot_token"
              value={formData.bot_token || ''}
              onChange={handleInputChange}
              placeholder="Enter your Telegram bot token"
              helperText="Get this from BotFather on Telegram"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Webhook URL (Optional)"
              name="webhook_url"
              value={formData.webhook_url || ''}
              onChange={handleInputChange}
              placeholder="https://your-webhook-url.com"
              helperText="Leave empty to use default webhook"
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
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? 'Saving...' : 'Save Telegram Integration'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default TelegramIntegrationForm;