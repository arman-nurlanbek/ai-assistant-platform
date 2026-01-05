import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAssistants } from '../hooks/useAssistants';
import { useIntegrations } from '../hooks/useIntegrations';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import Loader from '../components/common/Loader';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExtensionIcon from '@mui/icons-material/Extension';

const Dashboard: React.FC = () => {
  const { getAssistantsQuery } = useAssistants();
  const { 
    getTelegramIntegrationsQuery,
    getWhatsAppIntegrationsQuery,
    getGoogleSheetsIntegrationsQuery
  } = useIntegrations();
  
  // Fix: Call the hook directly instead of using the function
  const { getTextsCountQuery } = useKnowledgeBase();
  const textsCountQuery = getTextsCountQuery();

  const isLoading = 
    getAssistantsQuery.isLoading || 
    getTelegramIntegrationsQuery.isLoading ||
    getWhatsAppIntegrationsQuery.isLoading ||
    getGoogleSheetsIntegrationsQuery.isLoading ||
    textsCountQuery.isLoading;

  if (isLoading) {
    return <Loader message="Loading dashboard data..." />;
  }

  const assistantsCount = getAssistantsQuery.data?.length || 0;
  const telegramIntegrationsCount = getTelegramIntegrationsQuery.data?.length || 0;
  const whatsAppIntegrationsCount = getWhatsAppIntegrationsQuery.data?.length || 0;
  const googleSheetsIntegrationsCount = getGoogleSheetsIntegrationsQuery.data?.length || 0;
  const totalIntegrationsCount = 
    telegramIntegrationsCount + 
    whatsAppIntegrationsCount + 
    googleSheetsIntegrationsCount;
  
  const textsCount = textsCountQuery.data?.count || 0;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Quick Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: 'primary.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SmartToyIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                AI Assistants
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', my: 'auto' }}>
              {assistantsCount}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: 'secondary.light',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IntegrationInstructionsIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Integrations
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', my: 'auto' }}>
              {totalIntegrationsCount}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: '#42a5f5', // Another blue shade
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MenuBookIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Knowledge Base
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', my: 'auto' }}>
              {textsCount}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              backgroundColor: '#2196f3', // Another blue shade
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ExtensionIcon sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Custom Functions
              </Typography>
            </Box>
            <Typography variant="h6" component="div" sx={{ my: 'auto' }}>
              User Data Management
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button 
                    component={Link}
                    to="/assistants/new"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Create Assistant
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    component={Link}
                    to="/integrations"
                    variant="contained"
                    color="secondary"
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Setup Integration
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    component={Link}
                    to="/knowledge-base"
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Add Knowledge
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    component={Link}
                    to="/functions"
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    Configure Functions
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Integration Stats
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1">Telegram</Typography>
                    <Typography variant="h6" color="primary">{telegramIntegrationsCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1">WhatsApp (GreenAPI)</Typography>
                    <Typography variant="h6" color="primary">{whatsAppIntegrationsCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1">Google Sheets</Typography>
                    <Typography variant="h6" color="primary">{googleSheetsIntegrationsCount}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button 
                component={Link}
                to="/integrations"
                size="small"
                color="primary"
              >
                View All Integrations
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;