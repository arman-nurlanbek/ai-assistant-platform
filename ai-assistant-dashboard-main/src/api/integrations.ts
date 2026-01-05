import api from '../utils/api';
import { 
  TelegramIntegration, 
  GreenAPIIntegration, 
  GoogleSheetsIntegration 
} from '../types/integration';

// Telegram Integrations
export const getTelegramIntegrations = async (): Promise<TelegramIntegration[]> => {
  const response = await api.get('/get_all_telegram_integrations');
  return response.data;
};

export const setupTelegramIntegration = async (
  botToken: string,
  integration: TelegramIntegration
): Promise<any> => {
  const response = await api.post(`/telegram-integration/${botToken}`, integration);
  return response.data;
};

export const deleteTelegramIntegration = async (integrationId: string): Promise<any> => {
  const response = await api.delete(`/delete_telegram_integration/${integrationId}`);
  return response.data;
};

// WhatsApp Integrations (via GreenAPI)
export const getWhatsAppIntegrations = async (): Promise<GreenAPIIntegration[]> => {
  const response = await api.get('/all-greenapi-integrations');
  return response.data;
};

export const setupWhatsAppIntegration = async (
  integration: GreenAPIIntegration
): Promise<any> => {
  const response = await api.post('/greenapi-integration', integration);
  return response.data;
};

export const deleteWhatsAppIntegration = async (integrationId: string): Promise<any> => {
  const response = await api.delete(`/delete_whatsapp_integration/${integrationId}`);
  return response.data;
};

// Google Sheets Integrations
export const getGoogleSheetsIntegrations = async (): Promise<GoogleSheetsIntegration[]> => {
  const response = await api.get('/get_all_google_sheets_integration');
  return response.data;
};

export const setupGoogleSheetsIntegration = async (
  integration: GoogleSheetsIntegration
): Promise<any> => {
  const response = await api.post('/google-sheets-integration', integration);
  return response.data;
};

export const deleteGoogleSheetsIntegration = async (integrationId: string): Promise<any> => {
  const response = await api.delete(`/delete_google_sheets_integration/${integrationId}`);
  return response.data;
};