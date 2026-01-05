import api from '../utils/api';
import { AIAssistant, AIAssistantUpdate } from '../types/assistant';

export const getAssistants = async (): Promise<AIAssistant[]> => {
  const response = await api.get('/assistants');
  return response.data;
};

export const createAssistant = async (assistant: AIAssistant): Promise<AIAssistant> => {
  const response = await api.post('/ai-config', assistant);
  return response.data;
};

export const getAssistant = async (assistantId: string): Promise<AIAssistant> => {
  const response = await api.get(`/ai-config/${assistantId}`);
  return response.data;
};

export const updateAssistant = async (
  assistantId: string,
  assistant: AIAssistant
): Promise<AIAssistant> => {
  const response = await api.put(`/ai-config/${assistantId}`, assistant);
  return response.data;
};

export const updateAssistantPartial = async (
  assistantId: string,
  update: AIAssistantUpdate
): Promise<AIAssistant> => {
  const response = await api.patch(`/ai-config/${assistantId}`, update);
  return response.data;
};

export const updateAssistantField = async (
  assistantId: string,
  field: string,
  value: any
): Promise<AIAssistant> => {
  const response = await api.patch(`/ai-config/${assistantId}/${field}`, value);
  return response.data;
};