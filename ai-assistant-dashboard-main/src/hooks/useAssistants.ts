import { useQuery, useMutation, useQueryClient } from 'react-query';
import { assistantsApi } from '../api';
import { AIAssistant, AIAssistantUpdate } from '../types/assistant';

export const useAssistants = () => {
  const queryClient = useQueryClient();

  // Get all assistants
  const getAssistantsQuery = useQuery<any[], Error>(
    'assistants',
    async () => {
      const data = await assistantsApi.getAssistants();
      return data.map(assistant => ({
        ...assistant,
        assistant_id: assistant._id
      }));
    }
  );

  // Get assistant by ID
  const getAssistant = (assistantId?: string) => {
    return useQuery<AIAssistant, Error>(
      ['assistant', assistantId],
      () => assistantsApi.getAssistant(assistantId!),
      {
        enabled: !!assistantId, // Only run query if assistantId is provided
      }
    );
  };

  // Create a new assistant
  const createAssistantMutation = useMutation<AIAssistant, Error, AIAssistant>(
    (data: AIAssistant) => assistantsApi.createAssistant(data),
    {
      onSuccess: () => {
        // Invalidate and refetch the assistants list
        queryClient.invalidateQueries('assistants');
      },
    }
  );

  // Update an existing assistant
  const updateAssistantMutation = useMutation<AIAssistant, Error, { id: string; data: AIAssistant }>(
    ({ id, data }) => assistantsApi.updateAssistant(id, data),
    {
      onSuccess: (data) => {
        // Update cache for the specific assistant and the assistants list
        queryClient.setQueryData(['assistant', data.assistant_id], data);
        queryClient.invalidateQueries('assistants');
      },
    }
  );

  // Update assistant with partial data
  const updateAssistantPartialMutation = useMutation<
    AIAssistant,
    Error,
    { id: string; data: AIAssistantUpdate }
  >(({ id, data }) => assistantsApi.updateAssistantPartial(id, data), {
    onSuccess: (data) => {
      queryClient.setQueryData(['assistant', data.assistant_id], data);
      queryClient.invalidateQueries('assistants');
    },
  });

  // Update a single assistant field
  const updateAssistantFieldMutation = useMutation<
    AIAssistant,
    Error,
    { id: string; field: string; value: any }
  >(({ id, field, value }) => assistantsApi.updateAssistantField(id, field, value), {
    onSuccess: (data) => {
      queryClient.setQueryData(['assistant', data.assistant_id], data);
      queryClient.invalidateQueries('assistants');
    },
  });

  // Delete an assistant (not explicitly provided in the API docs, but adding for completeness)
  const deleteAssistantMutation = useMutation<void, Error, string>(
    (_id: string) => {
      // This is a placeholder. The actual API endpoint for deletion would be needed.
      // For now, we'll just simulate a successful response
      return Promise.resolve();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('assistants');
      },
    }
  );

  return {
    getAssistantsQuery,
    getAssistant,
    createAssistantMutation,
    updateAssistantMutation,
    updateAssistantPartialMutation,
    updateAssistantFieldMutation,
    deleteAssistantMutation,
  };
};