import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import SaveUserDataForm from '../components/functions/SaveUserDataForm';
import { useFunctions } from '../hooks/useFunctions';
import { useAssistants } from '../hooks/useAssistants';
import { useQuery } from 'react-query';
import { functionsApi } from '../api';
import Loader from '../components/common/Loader';
import { SaveUserDataSchema, SaveUserDataResponse } from '../types/function';

const CustomFunctions: React.FC = () => {
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { 
    activateSaveUserDataMutation,
    updateSaveUserDataSchemaMutation,
    deleteEntityMutation,
    deactivateSaveUserDataMutation,
  } = useFunctions();

  const { getAssistantsQuery } = useAssistants();
  const [selectedAssistant, setSelectedAssistant] = useState<string>("");

  const handleActivateSaveUserData = async (assistantId: string, schema: SaveUserDataSchema) => {
    try {
      console.log('Activating function with schema:', schema);
      await activateSaveUserDataMutation.mutateAsync({ assistantId, schema });
      setSnackbar({
        open: true,
        message: 'Save User Data function activated successfully',
        severity: 'success',
      });
      await schemaQuery.refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error activating Save User Data function: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleUpdateSaveUserDataSchema = async (assistantId: string, schema: SaveUserDataSchema) => {
    try {
      console.log("Attempting to update schema...");
      
      try {
        await functionsApi.getSaveUserDataSchema(assistantId);
        await updateSaveUserDataSchemaMutation.mutateAsync({ assistantId, schema });
        setSnackbar({
          open: true,
          message: 'Save User Data schema updated successfully',
          severity: 'success',
        });
      } catch (error) {
        console.log("Function not activated yet, activating now...");
        await activateSaveUserDataMutation.mutateAsync({ assistantId, schema });
        setSnackbar({
          open: true,
          message: 'Save User Data function activated successfully',
          severity: 'success',
        });
      }
      
      await schemaQuery.refetch();
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating Save User Data schema: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleDeleteEntity = async (assistantId: string, entityName: string) => {
    try {
      await deleteEntityMutation.mutateAsync({ assistantId, entityName });
      setSnackbar({
        open: true,
        message: 'Entity deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting entity: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleDeactivateSaveUserData = async (assistantId: string) => {
    try {
      await deactivateSaveUserDataMutation.mutateAsync(assistantId);
      setSnackbar({
        open: true,
        message: 'Save User Data function deactivated successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deactivating Save User Data function: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const schemaQuery = useQuery<SaveUserDataResponse, Error>(
    ['save-user-data-schema', selectedAssistant],
    () => functionsApi.getSaveUserDataSchema(selectedAssistant),
    {
      enabled: !!selectedAssistant,
      retry: false,
    }
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isLoading = getAssistantsQuery.isLoading;

  if (isLoading) {
    return <Loader message="Loading custom functions data..." />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Custom Functions
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Available Functions
          </Typography>
          
          <SaveUserDataForm
            assistants={getAssistantsQuery.data || []}
            onActivate={handleActivateSaveUserData}
            onUpdate={handleUpdateSaveUserDataSchema}
            onDeleteEntity={handleDeleteEntity}
            onDeactivate={handleDeactivateSaveUserData}
            selectedAssistant={selectedAssistant}
            onAssistantChange={setSelectedAssistant}
            schemaData={schemaQuery.data}
            isSchemaLoading={schemaQuery.isLoading}
            schemaError={schemaQuery.error}
          />
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomFunctions;