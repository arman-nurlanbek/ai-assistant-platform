import api from '../utils/api';
import { SaveUserDataSchema, SaveUserDataResponse } from '../types/function';
import axios from 'axios';

export const activateSaveUserDataFunction = async (
  assistantId: string,
  schema: SaveUserDataSchema
): Promise<any> => {
  const response = await api.post('/functions/save_user_data/activate', schema, {
    params: { assistant_id: assistantId },
  });
  return response.data;
};

export const updateSaveUserDataSchema = async (
  assistantId: string,
  schema: SaveUserDataSchema
): Promise<any> => {
  const response = await api.put('/functions/save_user_data/update', schema, {
    params: { assistant_id: assistantId },
  });
  return response.data;
};

export const deleteEntityFromSaveUserDataSchema = async (
  assistantId: string,
  entityName: string
): Promise<any> => {
  const response = await api.delete(`/functions/save_user_data/entity/${entityName}`, {
    params: { assistant_id: assistantId },
  });
  return response.data;
};

export const deactivateSaveUserDataFunction = async (assistantId: string): Promise<any> => {
  const response = await api.delete('/functions/save_user_data/deactivate', {
    params: { assistant_id: assistantId },
  });
  return response.data;
};

export const getSaveUserDataSchema = async (assistantId: string): Promise<SaveUserDataResponse> => {
  try {
    const response = await api.get('/functions/save_user_data/schema', {
      params: { assistant_id: assistantId },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        assistant_id: assistantId,
        name: 'save_user_data',
        schema: {},
        created_at: '',
        updated_at: null
      };
    }
    throw error;
  }
};