import React, { useState } from 'react';
import { Box, Alert, Snackbar } from '@mui/material';
import AssistantList from '../components/assistants/AssistantList';
import { useAssistants } from '../hooks/useAssistants';

const Assistants: React.FC = () => {
  const { getAssistantsQuery, deleteAssistantMutation } = useAssistants();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleDeleteAssistant = async (id: string) => {
    try {
      await deleteAssistantMutation.mutateAsync(id);
      setSnackbar({
        open: true,
        message: 'Assistant deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting assistant: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <AssistantList
        assistants={getAssistantsQuery.data || []}
        isLoading={getAssistantsQuery.isLoading}
        error={getAssistantsQuery.error}
        onDelete={handleDeleteAssistant}
      />

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

export default Assistants;