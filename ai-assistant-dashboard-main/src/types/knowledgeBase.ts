export interface TextData {
    title: string;
    content: string;
    metadata?: Record<string, any>;
    assistant_id?: string;
  }
  
  export interface TextDataResponse extends TextData {
    id: string;
    created_at: string;
    updated_at?: string;
  }
  
  export interface TextDataUpdate {
    title?: string;
    content?: string;
    metadata?: Record<string, any>;
    assistant_id?: string;
  }
  
  export interface SearchQuery {
    query: string;
    filter_by?: Record<string, any>;
    limit?: number;
  }
  
  export interface SearchResponse {
    results: TextDataResponse[];
    total: number;
  }