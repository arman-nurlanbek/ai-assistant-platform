import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { SelectChangeEvent } from '@mui/material/Select';
import { SaveUserDataSchema, SaveUserDataResponse } from '../../types/function';
import { AIAssistant } from '../../types/assistant';

interface SaveUserDataFormProps {
  assistants: AIAssistant[];
  onActivate: (assistantId: string, schema: SaveUserDataSchema) => Promise<void>;
  onUpdate: (assistantId: string, schema: SaveUserDataSchema) => Promise<void>;
  onDeactivate: (assistantId: string) => Promise<void>;
  onDeleteEntity: (assistantId: string, entityName: string) => Promise<void>;
  
  selectedAssistant: string;
  onAssistantChange: (assistantId: string) => void;
  schemaData?: SaveUserDataResponse;
  isSchemaLoading: boolean;
  schemaError: Error | null;
}

const SaveUserDataForm: React.FC<SaveUserDataFormProps> = ({
  assistants,
  onUpdate,
  onDeleteEntity,
  onDeactivate,
  selectedAssistant,
  onAssistantChange,
  schemaData,
  isSchemaLoading,
  schemaError,
}) => {
  const [schema, setSchema] = useState<SaveUserDataSchema>({});
  const [isSchemaActive, setIsSchemaActive] = useState<boolean>(false);
  const [newEntityName, setNewEntityName] = useState<string>('');
  const [newEntityType, setNewEntityType] = useState<string>('string');
  const [newEntityDescription, setNewEntityDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAssistant) {
      if (isSchemaLoading) {
        setIsLoading(true);
      } else if (schemaData && schemaData.schema) {
        // Schema data found, function is active
        setSchema(schemaData.schema);
        setIsSchemaActive(true);
        setIsLoading(false);
      } else {
        // Handle 404 case - function not activated
        const errorMessage = schemaError instanceof Error ? schemaError.message : '';
        const isNotActivated = errorMessage.includes('not activated');
        
        if (isNotActivated) {
          console.log("Function not activated for this assistant");
          // Clear schema and set as inactive
          setSchema({});
          setIsSchemaActive(false);
        }
        setIsLoading(false);
      }
    }
  }, [selectedAssistant, schemaData, isSchemaLoading, schemaError]);

  const handleAssistantChange = (e: SelectChangeEvent<string>) => {
    console.log('Selected assistant:', e.target.value);
    onAssistantChange(e.target.value);
  };

  const handleAddEntity = () => {
    if (!newEntityName.trim()) {
      setError('Entity name cannot be empty');
      return;
    }
  
    if (schema[newEntityName]) {
      setError(`Entity "${newEntityName}" already exists`);
      return;
    }
  
    setSchema((prev) => ({
      ...prev,
      [newEntityName]: {
        type: newEntityType as 'string' | 'bool' | 'int' | 'float' | 'dict',
        description: newEntityDescription || `Store user's ${newEntityName}`,
      },
    }));
  
    setNewEntityName('');
    setNewEntityDescription('');
    setError(null);
  };

  const handleDeleteEntity = async (entityName: string) => {
    if (isSchemaActive) {
      try {
        await onDeleteEntity(selectedAssistant, entityName);
        setSuccess(`Entity "${entityName}" deleted successfully`);
      } catch (err) {
        setError('Failed to delete entity: ' + (err instanceof Error ? err.message : String(err)));
        return;
      }
    }
    
    setSchema((prev) => {
      const newSchema = { ...prev };
      delete newSchema[entityName];
      return newSchema;
    });
  };

  const handleUpdate = async () => {
    if (!selectedAssistant) {
      setError('Please select an assistant');
      return;
    }

    if (Object.keys(schema).length === 0) {
      setError('Schema cannot be empty. Please add at least one entity.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onUpdate(selectedAssistant, schema);
      
      setIsSchemaActive(true);
      setSuccess(isSchemaActive ? 'Schema updated successfully' : 'Save User Data function activated successfully');
    } catch (err) {
      setError('Failed to update schema: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedAssistant) {
      setError('Please select an assistant');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onDeactivate(selectedAssistant);
      setIsSchemaActive(false);
      setSchema({});
      setSuccess('Save User Data function deactivated successfully');
    } catch (err) {
      setError('Failed to deactivate function: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Save User Data Function
      </Typography>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        This function allows the assistant to save user data during conversations.
        Define the schema of user data you want to collect.
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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Select Assistant</InputLabel>
            <Select<string>
              value={selectedAssistant}
              onChange={handleAssistantChange}
              label="Select Assistant"
              disabled={isLoading}
            >
              <MenuItem value="">
                <em>Select an assistant</em>
              </MenuItem>
              {assistants.map((assistant) => {
                const assistantId = assistant._id || '';
                return (
                  <MenuItem key={assistantId} value={assistantId}>
                    {assistant.name} (ID: {assistantId.substring(0, 8)}...)
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {selectedAssistant && (
        <>
          <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Entity Schema
            </Typography>
            <Divider />
          </Box>

          {!isSchemaActive && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This function is not currently activated for this assistant. 
              First define your schema below, then click "Activate Function".
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Entity Name"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="e.g. name, age, email"
                disabled={isLoading}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newEntityType}
                  onChange={(e: SelectChangeEvent) => setNewEntityType(e.target.value)}
                  label="Type"
                  disabled={isLoading}
                >
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="bool">Boolean</MenuItem>
                  <MenuItem value="int">Integer</MenuItem>
                  <MenuItem value="float">Float</MenuItem>
                  <MenuItem value="dict">Object/Dictionary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Description"
                value={newEntityDescription}
                onChange={(e) => setNewEntityDescription(e.target.value)}
                placeholder="Describe this field"
                disabled={isLoading}
              />
            </Grid>
            
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleAddEntity}
                disabled={isLoading || !newEntityName.trim()}
                startIcon={<AddIcon />}
                sx={{ height: '56px' }}
              >
                Add
              </Button>
            </Grid>
          </Grid>

          {Object.keys(schema).length > 0 ? (
            <TableContainer sx={{ mb: 4 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entity Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(schema).map(([name, entity]) => {
                    if (!entity) {
                      console.warn(`Entity '${name}' is null or undefined`);
                      return null; 
                    }
                    
                    return (
                      <TableRow key={name}>
                        <TableCell>{name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={entity.type || 'unknown'} 
                            color={
                              entity.type === 'string' ? 'primary' :
                              entity.type === 'bool' ? 'secondary' :
                              entity.type === 'int' || entity.type === 'float' ? 'info' :
                              'default'
                            } 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{entity.description || ''}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteEntity(name)}
                            disabled={isLoading}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info" sx={{ mb: 4 }}>
              No entities defined yet. Add at least one entity to save user data.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {isSchemaActive ? (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeactivate}
                  disabled={isLoading}
                >
                  Deactivate Function
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdate}
                  disabled={isLoading || Object.keys(schema).length === 0}
                >
                  Update Schema
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpdate}  
                disabled={isLoading || Object.keys(schema).length === 0}
              >
                Save & Activate Function
              </Button>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SaveUserDataForm;