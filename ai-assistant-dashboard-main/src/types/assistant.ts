export interface TruncationStrategy {
    type: string;
    last_messages: number;
  }
  
  export interface AIAssistant {
    assistant_id?: string;
    _id?: string;  
    openai_id: string;
    name: string;
    model: string;
    instructions?: string;
    temperature: number;
    functions_on: boolean;
    message_buffer: number;
    created_at: string;
    updated_at?: string;
    hello_message: string;
    error_message: string;
    max_tokens: number;
    search_count: number;
    truncation_strategy: TruncationStrategy;
    min_relatedness: number;
  }
  
  export interface AIAssistantUpdate {
    openai_id?: string;
    name?: string;
    model?: string;
    instructions?: string;
    temperature?: number;
    functions_on?: boolean;
    message_buffer?: number;
    hello_message?: string;
    error_message?: string;
    max_tokens?: number;
    search_count?: number;
    truncation_strategy?: TruncationStrategy;
    min_relatedness?: number;
  }