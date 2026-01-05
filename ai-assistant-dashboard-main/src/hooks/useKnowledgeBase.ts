import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from 'react-query';
import { knowledgeBaseApi } from '../api';
import { 
  TextData, 
  TextDataResponse, 
  TextDataUpdate, 
  SearchQuery, 
  SearchResponse 
} from '../types/knowledgeBase';

export const useKnowledgeBase = () => {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 10;

  const textsCountQuery = useQuery<{ count: number }, Error>(
    ['knowledge-base-count'],
    () => knowledgeBaseApi.countTextsInKnowledgeBase()
  );
  // Get paginated texts from knowledge base
  const getTextsQuery = (assistantId?: string) => {
    return useInfiniteQuery<TextDataResponse[], Error>(
      ['knowledge-base-texts', assistantId],
      ({ pageParam = 0 }) => knowledgeBaseApi.getTextsFromKnowledgeBase(
        pageParam * PAGE_SIZE, 
        PAGE_SIZE, 
        assistantId
      ),
      {
        getNextPageParam: (lastPage, pages) => {
          // If the last page has fewer items than the page size,
          // we know we've reached the end
          return lastPage.length < PAGE_SIZE ? undefined : pages.length;
        },
      }
    );
  };

  // Count texts in knowledge base
  const getTextsCountQuery = (assistantId?: string) => {
    return useQuery<{ count: number }, Error>(
      ['knowledge-base-count', assistantId],
      () => knowledgeBaseApi.countTextsInKnowledgeBase(assistantId)
    );
  };

  // Get single text from knowledge base
  const getTextQuery = (textId?: string) => {
    return useQuery<TextDataResponse, Error>(
      ['knowledge-base-text', textId],
      () => knowledgeBaseApi.getTextFromKnowledgeBase(textId!),
      {
        enabled: !!textId,
      }
    );
  };

  // Add text to knowledge base
  const addTextMutation = useMutation<TextDataResponse, Error, TextData>(
    (data: TextData) => knowledgeBaseApi.addTextToKnowledgeBase(data),
    {
      onSuccess: (data) => {
        // Invalidate the texts list query
        queryClient.invalidateQueries(['knowledge-base-texts', data.assistant_id]);
        queryClient.invalidateQueries(['knowledge-base-count', data.assistant_id]);
      },
    }
  );

  // Update text in knowledge base
  const updateTextMutation = useMutation<
    TextDataResponse,
    Error,
    { textId: string; data: TextDataUpdate }
  >(
    ({ textId, data }) => knowledgeBaseApi.updateTextInKnowledgeBase(textId, data),
    {
      onSuccess: (data) => {
        // Update cache for the specific text and invalidate the texts list
        queryClient.setQueryData(['knowledge-base-text', data.id], data);
        queryClient.invalidateQueries(['knowledge-base-texts', data.assistant_id]);
      },
    }
  );

  // Delete text from knowledge base
  const deleteTextMutation = useMutation<any, Error, string>(
    (textId: string) => knowledgeBaseApi.deleteTextFromKnowledgeBase(textId),
    {
      onSuccess: (_data, textId) => {
        // We need to get the assistantId from the deleted text to invalidate the correct query
        const deletedText = queryClient.getQueryData<TextDataResponse>(['knowledge-base-text', textId]);
        const assistantId = deletedText?.assistant_id;
        
        // Remove the text from cache and invalidate the texts list
        queryClient.removeQueries(['knowledge-base-text', textId]);
        queryClient.invalidateQueries(['knowledge-base-texts', assistantId]);
        queryClient.invalidateQueries(['knowledge-base-count', assistantId]);
      },
    }
  );

  // Search texts in knowledge base
  const searchTextsMutation = useMutation<SearchResponse, Error, SearchQuery>(
    (query: SearchQuery) => knowledgeBaseApi.searchTextsInKnowledgeBase(query)
  );

  return {
    getTextsQuery,
    getTextsCountQuery,
    getTextQuery,
    addTextMutation,
    textsCountQuery,
    updateTextMutation,
    deleteTextMutation,
    searchTextsMutation,
  };
};