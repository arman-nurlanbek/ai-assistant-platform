export interface FunctionModel {
    function_id?: string;
    name: string;
    description: string;
    parameters: Record<string, any>;
    assistant_id: string;
  }
  
  export interface SaveUserDataEntity {
    type: 'string' | 'bool' | 'int' | 'float' | 'dict';
    description: string;
  }
  
  export interface SaveUserDataResponse {
    assistant_id: string;
    name: string;
    schema: SaveUserDataSchema;
    created_at: string;
    updated_at: string | null;
  }
  
  export interface SaveUserDataSchema {
    [key: string]: SaveUserDataEntity;
  }
  
  export interface SaveUserDataEntity {
    type: 'string' | 'bool' | 'int' | 'float' | 'dict';
    description: string;
  }