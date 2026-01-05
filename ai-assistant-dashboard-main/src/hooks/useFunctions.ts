import { useMutation, useQuery } from 'react-query';
import { functionsApi } from '../api';
import { SaveUserDataSchema, SaveUserDataResponse } from '../types/function';

export const useFunctions = () => {
  // Activate save_user_data function
  const activateSaveUserDataMutation = useMutation<
    any,
    Error,
    { assistantId: string; schema: SaveUserDataSchema }
  >(({ assistantId, schema }) => functionsApi.activateSaveUserDataFunction(assistantId, schema));

  // Update save_user_data schema
  const updateSaveUserDataSchemaMutation = useMutation<
    any,
    Error,
    { assistantId: string; schema: SaveUserDataSchema }
  >(({ assistantId, schema }) => functionsApi.updateSaveUserDataSchema(assistantId, schema));

  // Delete entity from save_user_data schema
  const deleteEntityMutation = useMutation<any, Error, { assistantId: string; entityName: string }>(
    ({ assistantId, entityName }) =>
      functionsApi.deleteEntityFromSaveUserDataSchema(assistantId, entityName)
  );

  // Deactivate save_user_data function
  const deactivateSaveUserDataMutation = useMutation<any, Error, string>(
    (assistantId: string) => functionsApi.deactivateSaveUserDataFunction(assistantId)
  );

  // Get save_user_data schema
  const getSaveUserDataSchemaQuery = (assistantId?: string) => {
    return useQuery<SaveUserDataResponse, Error>(
      ['save-user-data-schema', assistantId],
      () => functionsApi.getSaveUserDataSchema(assistantId!),
      {
        enabled: !!assistantId,
        retry: false,
        onError: () => {
          return null;
        },
        select: (data) => data,
      }
    );
  };

  return {
    activateSaveUserDataMutation,
    updateSaveUserDataSchemaMutation,
    deleteEntityMutation,
    deactivateSaveUserDataMutation,
    getSaveUserDataSchemaQuery,
  };
};