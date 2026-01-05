import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Snackbar, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssistantForm from '../components/assistants/AssistantForm';
import Loader from '../components/common/Loader';
import { useAssistants } from '../hooks/useAssistants';
import { AIAssistant } from '../types/assistant';

interface AssistantDetailProps {
  isEdit?: boolean;
}

const AssistantDetail: React.FC<AssistantDetailProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewAssistant = !id;
  
  const { 
    getAssistant, 
    createAssistantMutation, 
    updateAssistantMutation 
  } = useAssistants();
  
  const assistantQuery = getAssistant(id);
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!isNewAssistant && !isEdit) {
      // If we're viewing an existing assistant (not editing), and the data is loaded,
      // but there's no assistant data, navigate back to the assistants list
      if (assistantQuery.isSuccess && !assistantQuery.data) {
        navigate('/assistants');
      }
    }
  }, [assistantQuery.isSuccess, assistantQuery.data, isNewAssistant, isEdit, navigate]);

  const handleAssistantSubmit = async (data: Partial<AIAssistant>) => {
    try {
      if (isNewAssistant) {
        await createAssistantMutation.mutateAsync(data as AIAssistant);
        setSnackbar({
          open: true,
          message: 'Assistant created successfully',
          severity: 'success',
        });
        // Navigate back to assistants list after successful creation
        navigate('/assistants');
      } else if (id) {
        await updateAssistantMutation.mutateAsync({ id, data: data as AIAssistant });
        setSnackbar({
          open: true,
          message: 'Assistant updated successfully',
          severity: 'success',
        });
        // Navigate to assistant details view after successful update
        navigate(`/assistants/${id}`);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error ${isNewAssistant ? 'creating' : 'updating'} assistant: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  // Handle loading state
  if (!isNewAssistant && assistantQuery.isLoading) {
    return <Loader message="Loading assistant data..." />;
  }

  // Handle error state
  if (!isNewAssistant && assistantQuery.isError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Alert severity="error">
          Error loading assistant: {assistantQuery.error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          {isNewAssistant
            ? 'Create New Assistant'
            : isEdit
            ? `Edit ${assistantQuery.data?.name || 'Assistant'}`
            : assistantQuery.data?.name || 'Assistant Details'}
        </Typography>
      </Box>

      {!isNewAssistant && !isEdit && assistantQuery.data && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/assistants/${id}/edit`)}
            sx={{ mr: 2 }}
          >
            Edit Assistant
          </Button>
        </Box>
      )}

      {/* Only show the form for new assistants or when editing */}
      {(isNewAssistant || isEdit) && (
        <AssistantForm
          initialData={isNewAssistant ? undefined : assistantQuery.data}
          onSubmit={handleAssistantSubmit}
          isLoading={createAssistantMutation.isLoading || updateAssistantMutation.isLoading}
        />
      )}

      {/* Read-only view for assistant details */}
      {!isNewAssistant && !isEdit && assistantQuery.data && (
        <Box>
          {/* Display assistant details in a more readable format here */}
          {/* This would be a read-only version of the assistant data */}
          {/* For brevity, not implemented in this example */}
        </Box>
      )}

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

export default AssistantDetail;