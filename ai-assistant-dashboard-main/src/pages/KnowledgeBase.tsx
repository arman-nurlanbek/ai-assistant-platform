import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import KnowledgeBaseForm from '../components/knowledgeBase/KnowledgeBaseForm';
import KnowledgeBaseSearch from '../components/knowledgeBase/KnowledgeBaseSearch';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import { useAssistants } from '../hooks/useAssistants';
import Loader from '../components/common/Loader';
import { TextData, TextDataResponse, SearchQuery, TextDataUpdate } from '../types/knowledgeBase';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`kb-tabpanel-${index}`}
      aria-labelledby={`kb-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const KnowledgeBase: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
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
    addTextMutation, 
    searchTextsMutation 
  } = useKnowledgeBase();
  
  const { getAssistantsQuery } = useAssistants();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddText = async (data: TextData | TextDataUpdate) => {
    try {
      if (
        typeof data.title === 'string' && 
        typeof data.content === 'string'
      ) {
        await addTextMutation.mutateAsync(data as TextData);
        setSnackbar({
          open: true,
          message: 'Text added to knowledge base successfully',
          severity: 'success',
        });
      } else {
        throw new Error('Title and content are required fields');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error adding text to knowledge base: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleSearch = async (query: SearchQuery): Promise<TextDataResponse[]> => {
    try {
      const result = await searchTextsMutation.mutateAsync(query);
      return result.results;
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error searching knowledge base: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isLoading = getAssistantsQuery.isLoading;

  if (isLoading) {
    return <Loader message="Loading knowledge base data..." />;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Knowledge Base
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab
            icon={<AddCircleIcon />}
            label="Add Knowledge"
            id="kb-tab-0"
            aria-controls="kb-tabpanel-0"
          />
          <Tab
            icon={<SearchIcon />}
            label="Search"
            id="kb-tab-1"
            aria-controls="kb-tabpanel-1"
          />
          <Tab
            icon={<FormatListBulletedIcon />}
            label="View All"
            id="kb-tab-2"
            aria-controls="kb-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <KnowledgeBaseForm
            assistants={getAssistantsQuery.data || []}
            onSubmit={handleAddText}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <KnowledgeBaseSearch
            assistants={getAssistantsQuery.data || []}
            onSearch={handleSearch}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Knowledge Base List will be implemented here */}
          <Alert severity="info">
            The "View All" feature will be implemented in future versions.
          </Alert>
        </TabPanel>
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

export default KnowledgeBase;