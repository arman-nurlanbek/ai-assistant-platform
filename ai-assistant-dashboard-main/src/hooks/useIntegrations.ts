import { useQuery, useMutation, useQueryClient } from 'react-query';
import { integrationsApi } from '../api';
import { 
  TelegramIntegration, 
  GreenAPIIntegration, 
  GoogleSheetsIntegration 
} from '../types/integration';

export const useIntegrations = () => {
  const queryClient = useQueryClient();

  // Telegram Integrations
  const getTelegramIntegrationsQuery = useQuery<TelegramIntegration[], Error>(
    'telegram-integrations',
    integrationsApi.getTelegramIntegrations
  );

  const setupTelegramIntegrationMutation = useMutation<
    any,
    Error,
    { botToken: string; integration: TelegramIntegration }
  >(
    ({ botToken, integration }) => integrationsApi.setupTelegramIntegration(botToken, integration),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('telegram-integrations');
      },
    }
  );

  const deleteTelegramIntegrationMutation = useMutation<any, Error, string>(
    (integrationId: string) => integrationsApi.deleteTelegramIntegration(integrationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('telegram-integrations');
      },
    }
  );

  // WhatsApp Integrations (via GreenAPI)
  const getWhatsAppIntegrationsQuery = useQuery<GreenAPIIntegration[], Error>(
    'whatsapp-integrations',
    integrationsApi.getWhatsAppIntegrations
  );

  const setupWhatsAppIntegrationMutation = useMutation<any, Error, GreenAPIIntegration>(
    (integration: GreenAPIIntegration) => integrationsApi.setupWhatsAppIntegration(integration),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('whatsapp-integrations');
      },
    }
  );

  const deleteWhatsAppIntegrationMutation = useMutation<any, Error, string>(
    (integrationId: string) => integrationsApi.deleteWhatsAppIntegration(integrationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('whatsapp-integrations');
      },
    }
  );

  // Google Sheets Integrations
  const getGoogleSheetsIntegrationsQuery = useQuery<GoogleSheetsIntegration[], Error>(
    'google-sheets-integrations',
    integrationsApi.getGoogleSheetsIntegrations
  );

  const setupGoogleSheetsIntegrationMutation = useMutation<any, Error, GoogleSheetsIntegration>(
    (integration: GoogleSheetsIntegration) => integrationsApi.setupGoogleSheetsIntegration(integration),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('google-sheets-integrations');
      },
    }
  );

  const deleteGoogleSheetsIntegrationMutation = useMutation<any, Error, string>(
    (integrationId: string) => integrationsApi.deleteGoogleSheetsIntegration(integrationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('google-sheets-integrations');
      },
    }
  );

  return {
    // Telegram
    getTelegramIntegrationsQuery,
    setupTelegramIntegrationMutation,
    deleteTelegramIntegrationMutation,
    
    // WhatsApp
    getWhatsAppIntegrationsQuery,
    setupWhatsAppIntegrationMutation,
    deleteWhatsAppIntegrationMutation,
    
    // Google Sheets
    getGoogleSheetsIntegrationsQuery,
    setupGoogleSheetsIntegrationMutation,
    deleteGoogleSheetsIntegrationMutation,
  };
};