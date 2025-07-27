import { useMutation, useQueryClient } from '@tanstack/react-query';

// Types for webhook sync data
export interface WebhookSyncResponse {
  success: boolean;
  message: string;
  entityId?: number;
  entityIds?: number[];
}

// Hook for syncing a single entity
export function useSyncEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: 'product' | 'category' | 'brand';
      entityId: number;
    }): Promise<WebhookSyncResponse> => {
      const response = await fetch('/api/webhook/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-single',
          entityType,
          entityId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync entity');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [variables.entityType, variables.entityId],
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: [variables.entityType + 's'],
      });
    },
  });
}

// Hook for syncing multiple entities
export function useBulkSyncEntities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityIds,
    }: {
      entityType: 'product' | 'category' | 'brand';
      entityIds: number[];
    }): Promise<WebhookSyncResponse> => {
      const response = await fetch('/api/webhook/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-bulk',
          entityType,
          entityIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync entities');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      variables.entityIds.forEach(entityId => {
        queryClient.invalidateQueries({
          queryKey: [variables.entityType, entityId],
        });
      });

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: [variables.entityType + 's'],
      });
    },
  });
}

// Hook for syncing all entities of a type
export function useSyncAllEntities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      entityType: 'product' | 'category' | 'brand'
    ): Promise<WebhookSyncResponse> => {
      // First get all entity IDs
      const response = await fetch(`/api/${entityType}s`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${entityType}s`);
      }

      const data = await response.json();
      const entityIds = data.items?.map((item: any) => item.id) || [];

      if (entityIds.length === 0) {
        return {
          success: true,
          message: `No ${entityType}s to sync`,
          entityIds: [],
        };
      }

      // Then sync all entities
      const syncResponse = await fetch('/api/webhook/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync-bulk',
          entityType,
          entityIds,
        }),
      });

      if (!syncResponse.ok) {
        const error = await syncResponse.json();
        throw new Error(error.error || `Failed to sync all ${entityType}s`);
      }

      return syncResponse.json();
    },
    onSuccess: (data, entityType) => {
      // Invalidate all queries for this entity type
      queryClient.invalidateQueries({
        queryKey: [entityType + 's'],
      });

      // Invalidate individual entity queries
      queryClient.invalidateQueries({
        queryKey: [entityType],
      });
    },
  });
}
