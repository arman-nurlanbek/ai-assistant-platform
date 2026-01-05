export interface TelegramIntegration {
    integration_id?: string;
    bot_token: string;
    webhook_url?: string;
    assistant_id?: string;
  }
  
  export interface GreenAPIIntegration {
    integration_id?: string;
    instance_id: string;
    api_token: string;
    assistant_id?: string;
    nums?: number;
  }
  
  export interface GoogleSheetsIntegration {
    integration_id?: string;
    spreadsheet_id: string;
    credentials_json: Record<string, any>;
    assistant_id?: string;
  }