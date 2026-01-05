import React from 'react';
import { Grid, Typography, Box, Button, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import { AIAssistant } from '../../types/assistant';
import AssistantCard from './AssistantCard';
import Loader from '../common/Loader';

interface AssistantListProps {
  assistants: AIAssistant[];
  isLoading: boolean;
  error: Error | null;
  onDelete: (id: string) => void;
}

const AssistantList: React.FC<AssistantListProps> = ({ 
  assistants, 
  isLoading, 
  error, 
  onDelete 
}) => {
  if (isLoading) {
    return <Loader message="Loading assistants..." />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading assistants: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}
      >
        <Typography variant="h4" component="h1">
          AI Assistants
        </Typography>
        <Button
          component={Link}
          to="/assistants/new"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Create New Assistant
        </Button>
      </Box>

      {assistants.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            backgroundColor: 'background.paper',
            borderRadius: 2
          }}
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No assistants found
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Create your first AI assistant to get started
          </Typography>
          <Button
            component={Link}
            to="/assistants/new"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Create New Assistant
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {assistants.map((assistant) => (
            <Grid item xs={12} sm={6} md={4} key={assistant.assistant_id}>
              <AssistantCard 
                assistant={assistant} 
                onDelete={onDelete} 
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AssistantList;