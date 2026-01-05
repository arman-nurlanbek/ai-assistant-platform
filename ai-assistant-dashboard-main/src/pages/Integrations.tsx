import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TelegramIcon from '@mui/icons-material/Telegram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TableChartIcon from '@mui/icons-material/TableChart';
import { useIntegrations } from '../hooks/useIntegrations';
import { useAssistants } from '../hooks/useAssistants';
import TelegramIntegrationForm from '../components/integrations/TelegramIntegrationForm';
import WhatsAppIntegrationForm from '../components/integrations/WhatsAppIntegrationForm';
import GoogleSheetsIntegrationForm from '../components/integrations/GoogleSheetsIntegrationForm';
import Loader from '../components/common/Loader';

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
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Integrations: React.FC = () => {
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
    getTelegramIntegrationsQuery,
    getWhatsAppIntegrationsQuery,
    getGoogleSheetsIntegrationsQuery,
    setupTelegramIntegrationMutation,
    setupWhatsAppIntegrationMutation,
    setupGoogleSheetsIntegrationMutation,
    deleteTelegramIntegrationMutation,
    deleteWhatsAppIntegrationMutation,
    deleteGoogleSheetsIntegrationMutation,
  } = useIntegrations();

  const { getAssistantsQuery } = useAssistants();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSetupTelegramIntegration = async (integration: any) => {
    try {
      await setupTelegramIntegrationMutation.mutateAsync({
        botToken: integration.bot_token,
        integration: {
          webhook_url: integration.webhook_url,
          assistant_id: integration.assistant_id,
          bot_token: integration.bot_token,
        },
      });
      setSnackbar({
        open: true,
        message: 'Telegram integration created successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error creating Telegram integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleSetupWhatsAppIntegration = async (integration: any) => {
    try {
      await setupWhatsAppIntegrationMutation.mutateAsync(integration);
      setSnackbar({
        open: true,
        message: 'WhatsApp integration created successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error creating WhatsApp integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleSetupGoogleSheetsIntegration = async (integration: any) => {
    try {
      await setupGoogleSheetsIntegrationMutation.mutateAsync(integration);
      setSnackbar({
        open: true,
        message: 'Google Sheets integration created successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error creating Google Sheets integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
      throw error;
    }
  };

  const handleDeleteTelegramIntegration = async (id: string) => {
    try {
      await deleteTelegramIntegrationMutation.mutateAsync(id);
      setSnackbar({
        open: true,
        message: 'Telegram integration deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting Telegram integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
    }
  };

  const handleDeleteWhatsAppIntegration = async (id: string) => {
    try {
      await deleteWhatsAppIntegrationMutation.mutateAsync(id);
      setSnackbar({
        open: true,
        message: 'WhatsApp integration deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting WhatsApp integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
    }
  };

  const handleDeleteGoogleSheetsIntegration = async (id: string) => {
    try {
      await deleteGoogleSheetsIntegrationMutation.mutateAsync(id);
      setSnackbar({
        open: true,
        message: 'Google Sheets integration deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error deleting Google Sheets integration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isLoading =
    getAssistantsQuery.isLoading ||
    getTelegramIntegrationsQuery.isLoading ||
    getWhatsAppIntegrationsQuery.isLoading ||
    getGoogleSheetsIntegrationsQuery.isLoading;

  if (isLoading) {
    return <Loader message="Loading integrations data..." />;
  }

  const findAssistantName = (assistantId?: string) => {
    if (!assistantId) return 'None';
    const assistant = getAssistantsQuery.data?.find((a) => a.assistant_id === assistantId);
    return assistant?.name || 'Unknown';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Integrations
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
            icon={<TelegramIcon />}
            label="Telegram"
            id="integration-tab-0"
            aria-controls="integration-tabpanel-0"
          />
          <Tab
            icon={<WhatsAppIcon />}
            label="WhatsApp"
            id="integration-tab-1"
            aria-controls="integration-tabpanel-1"
          />
          <Tab
            icon={<TableChartIcon />}
            label="Google Sheets"
            id="integration-tab-2"
            aria-controls="integration-tabpanel-2"
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <TelegramIntegrationForm
              assistants={getAssistantsQuery.data || []}
              onSubmit={handleSetupTelegramIntegration}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Current Telegram Integrations
          </Typography>

          {getTelegramIntegrationsQuery.data?.length === 0 ? (
            <Alert severity="info">No Telegram integrations found.</Alert>
          ) : (
            <Grid container spacing={3}>
              {getTelegramIntegrationsQuery.data?.map((integration) => (
                <Grid item xs={12} sm={6} key={integration.integration_id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          Telegram Bot
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => 
                            integration.integration_id && 
                            handleDeleteTelegramIntegration(integration.integration_id)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bot Token: {integration.bot_token.substring(0, 10)}...
                      </Typography>
                      {integration.webhook_url && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Webhook URL: {integration.webhook_url}
                        </Typography>
                      )}
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          Assistant:
                        </Typography>
                        <Chip
                          label={findAssistantName(integration.assistant_id)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 4 }}>
            <WhatsAppIntegrationForm
              assistants={getAssistantsQuery.data || []}
              onSubmit={handleSetupWhatsAppIntegration}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Current WhatsApp Integrations
          </Typography>

          {getWhatsAppIntegrationsQuery.data?.length === 0 ? (
            <Alert severity="info">No WhatsApp integrations found.</Alert>
          ) : (
            <Grid container spacing={3}>
              {getWhatsAppIntegrationsQuery.data?.map((integration) => (
                <Grid item xs={12} sm={6} key={integration.integration_id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          WhatsApp (GreenAPI)
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => 
                            integration.integration_id && 
                            handleDeleteWhatsAppIntegration(integration.integration_id)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Instance ID: {integration.instance_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Phone Number: {integration.nums || 7105}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          Assistant:
                        </Typography>
                        <Chip
                          label={findAssistantName(integration.assistant_id)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 4 }}>
            <GoogleSheetsIntegrationForm
              assistants={getAssistantsQuery.data || []}
              onSubmit={handleSetupGoogleSheetsIntegration}
            />
          </Box>

          <Typography variant="h6" gutterBottom>
            Current Google Sheets Integrations
          </Typography>

          {getGoogleSheetsIntegrationsQuery.data?.length === 0 ? (
            <Alert severity="info">No Google Sheets integrations found.</Alert>
          ) : (
            <Grid container spacing={3}>
              {getGoogleSheetsIntegrationsQuery.data?.map((integration) => (
                <Grid item xs={12} sm={6} key={integration.integration_id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          Google Sheets
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => 
                            integration.integration_id && 
                            handleDeleteGoogleSheetsIntegration(integration.integration_id)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Spreadsheet ID: {integration.spreadsheet_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Credentials: {integration.credentials_json ? 'Configured' : 'None'}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          Assistant:
                        </Typography>
                        <Chip
                          label={findAssistantName(integration.assistant_id)}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
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

export default Integrations;