import api from '../utils/api';
import { 
  TextData, 
  TextDataResponse, 
  TextDataUpdate, 
  SearchQuery, 
  SearchResponse 
} from '../types/knowledgeBase';

export const addTextToKnowledgeBase = async (textData: TextData): Promise<TextDataResponse> => {
  const response = await api.post('/knowledge-base/', textData);
  return response.data;
};

export const getTextsFromKnowledgeBase = async (
  skip = 0,
  limit = 10,
  assistantId?: string
): Promise<TextDataResponse[]> => {
  const params: any = { skip, limit };
  if (assistantId) {
    params.assistant_id = assistantId;
  }
  const response = await api.get('/knowledge-base/', { params });
  return response.data;
};

export const countTextsInKnowledgeBase = async (assistantId?: string): Promise<{ count: number }> => {
  const params: any = {};
  if (assistantId) {
    params.assistant_id = assistantId;
  }
  const response = await api.get('/knowledge-base/count', { params });
  return response.data;
};

export const getTextFromKnowledgeBase = async (textId: string): Promise<TextDataResponse> => {
  const response = await api.get(`/knowledge-base/${textId}`);
  return response.data;
};

export const updateTextInKnowledgeBase = async (
  textId: string,
  update: TextDataUpdate
): Promise<TextDataResponse> => {
  const response = await api.put(`/knowledge-base/${textId}`, update);
  return response.data;
};

export const deleteTextFromKnowledgeBase = async (textId: string): Promise<any> => {
  const response = await api.delete(`/knowledge-base/${textId}`);
  return response.data;
};

export const searchTextsInKnowledgeBase = async (
  searchQuery: SearchQuery
): Promise<SearchResponse> => {
  const response = await api.post('/knowledge-base/search', searchQuery);
  return response.data;
};