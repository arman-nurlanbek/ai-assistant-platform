import React from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { AIAssistant } from '../../types/assistant';

interface AssistantFormProps {
  initialData?: Partial<AIAssistant>;
  onSubmit: (data: Partial<AIAssistant>) => void;
  isLoading?: boolean;
}

const AssistantForm: React.FC<AssistantFormProps> = ({ 
  initialData, 
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = React.useState<Partial<AIAssistant>>(
    initialData || {
      name: '',
      model: 'gpt-4o-mini-2024-07-18',
      openai_id: '',
      instructions: '',
      temperature: 0.7,
      functions_on: false,
      message_buffer: 1,
      hello_message: 'Я готов консультировать!',
      error_message: 'Извините, не доступен, обратитесь позже.',
      max_tokens: 2000,
      search_count: 20,
      truncation_strategy: {
        type: 'last_messages',
        last_messages: 10
      },
      min_relatedness: 0.3
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSliderChange = (name: string) => (_: Event, value: number | number[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTruncationTypeChange = (e: SelectChangeEvent) => {
    setFormData((prev) => ({
      ...prev,
      truncation_strategy: {
        ...prev.truncation_strategy!,
        type: e.target.value
      }
    }));
  };

  const handleTruncationMessagesChange = (_: Event, value: number | number[]) => {
    setFormData((prev) => ({
      ...prev,
      truncation_strategy: {
        ...prev.truncation_strategy!,
        last_messages: value as number
      }
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const modelOptions = [
    'gpt-4',
    'gpt-4o-mini-2024-07-18',
    'gpt-4o'
  ];

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {initialData?.assistant_id ? 'Edit Assistant' : 'Create New Assistant'}
      </Typography>
      
      <Box component="form" onSubmit={handleFormSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Assistant Name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                name="model"
                value={formData.model || ''}
                onChange={e => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
                label="Model"
              >
                {modelOptions.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="OpenAI Key"
              name="openai_id"
              value={formData.openai_id || ''}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              name="instructions"
              value={formData.instructions || ''}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Temperature: {formData.temperature}</Typography>
            <Slider
              value={formData.temperature || 0.7}
              onChange={handleSliderChange('temperature')}
              min={0}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Min Relatedness: {formData.min_relatedness}</Typography>
            <Slider
              value={formData.min_relatedness || 0.3}
              onChange={handleSliderChange('min_relatedness')}
              min={0}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Max Tokens"
              name="max_tokens"
              type="number"
              value={formData.max_tokens || 2000}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Count"
              name="search_count"
              type="number"
              value={formData.search_count || 20}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Truncation Strategy</InputLabel>
              <Select
                value={formData.truncation_strategy?.type || 'last_messages'}
                onChange={handleTruncationTypeChange}
                label="Truncation Strategy"
              >
                <MenuItem value="last_messages">Last Messages</MenuItem>
                <MenuItem value="all_messages">All Messages</MenuItem>
              </Select>
              <FormHelperText>How to handle conversation history</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Last Messages: {formData.truncation_strategy?.last_messages}</Typography>
            <Slider
              value={formData.truncation_strategy?.last_messages || 10}
              onChange={handleTruncationMessagesChange}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              disabled={formData.truncation_strategy?.type !== 'last_messages'}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Hello Message"
              name="hello_message"
              value={formData.hello_message || ''}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Error Message"
              name="error_message"
              value={formData.error_message || ''}
              onChange={handleChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.functions_on || false}
                  onChange={handleSwitchChange}
                  name="functions_on"
                  color="primary"
                />
              }
              label="Enable Functions"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Message Buffer"
              name="message_buffer"
              type="number"
              value={formData.message_buffer || 1}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (initialData?.assistant_id ? 'Update Assistant' : 'Create Assistant')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default AssistantForm;