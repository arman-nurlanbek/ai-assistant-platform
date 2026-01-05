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
import { TextData, TextDataUpdate } from '../../types/knowledgeBase';
import { AIAssistant } from '../../types/assistant';

interface KnowledgeBaseFormProps {
  assistants: AIAssistant[];
  onSubmit: (data: TextData | TextDataUpdate) => Promise<void>;
  initialData?: TextDataUpdate & { id?: string };
  isUpdate?: boolean;
}

const KnowledgeBaseForm: React.FC<KnowledgeBaseFormProps> = ({
  assistants,
  onSubmit,
  initialData,
  isUpdate = false,
}) => {
  const [formData, setFormData] = useState<TextData | TextDataUpdate>(
    initialData || {
      title: '',
      content: '',
      metadata: {},
      assistant_id: '',
    }
  );
  const [metadataString, setMetadataString] = useState<string>(
    initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '{}'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

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

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadataString(e.target.value);
    setMetadataError(null);
    
    try {
      if (e.target.value) {
        const parsedMetadata = JSON.parse(e.target.value);
        setFormData((prev) => ({ ...prev, metadata: parsedMetadata }));
      } else {
        setFormData((prev) => ({ ...prev, metadata: {} }));
      }
    } catch (err) {
      setMetadataError('Invalid JSON format');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (metadataError) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(formData);
      setSuccess(`Knowledge base entry successfully ${isUpdate ? 'updated' : 'created'}!`);
      
      if (!isUpdate) {
        // Clear form if it's a new entry
        setFormData({
          title: '',
          content: '',
          metadata: {},
          assistant_id: formData.assistant_id, // Keep the same assistant selected
        });
        setMetadataString('{}');
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
        {isUpdate ? 'Edit Knowledge Base Entry' : 'Add New Knowledge Base Entry'}
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
              label="Title"
              name="title"
              value={formData.title || ''}
              onChange={handleInputChange}
              placeholder="Enter a descriptive title"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Content"
              name="content"
              value={formData.content || ''}
              onChange={handleInputChange}
              multiline
              rows={10}
              placeholder="Enter the knowledge base content here"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Metadata (JSON)"
              name="metadata_json"
              value={metadataString}
              onChange={handleMetadataChange}
              multiline
              rows={4}
              error={!!metadataError}
              helperText={metadataError || "Optional JSON metadata for categorization or additional information"}
              placeholder='{
  "category": "product",
  "tags": ["feature", "pricing"],
  "language": "en"
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
                <MenuItem value="">
                  <em>None (Global Knowledge)</em>
                </MenuItem>
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
              disabled={isLoading || !!metadataError}
              sx={{ mt: 2 }}
            >
              {isLoading 
                ? (isUpdate ? 'Updating...' : 'Saving...') 
                : (isUpdate ? 'Update Entry' : 'Save Entry')}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default KnowledgeBaseForm;