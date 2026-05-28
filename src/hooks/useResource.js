import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Cria uma família de hooks padronizada para um recurso CRUD.
 *
 * @example
 * const customers = createResourceHooks('customers', customersRepository);
 * customers.useList({ page, perPage, search, sort });
 * customers.useOne(id);
 * customers.useCreate();
 * customers.useUpdate();
 * customers.useDelete();
 */
export function createResourceHooks(name, repository) {
  const keys = {
    all: [name],
    lists: () => [name, 'list'],
    list: (params) => [name, 'list', params],
    details: () => [name, 'detail'],
    detail: (id) => [name, 'detail', id],
  };

  function useList(params = {}, options = {}) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => repository.list(params),
      placeholderData: (prev) => prev,
      ...options,
    });
  }

  function useOne(id, options = {}) {
    return useQuery({
      queryKey: keys.detail(id),
      queryFn: () => repository.getById(id),
      enabled: !!id,
      ...options,
    });
  }

  function useCreate(options = {}) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload) => repository.create(payload),
      onSuccess: (data, vars, ctx) => {
        qc.invalidateQueries({ queryKey: keys.lists() });
        options.onSuccess?.(data, vars, ctx);
      },
      ...options,
    });
  }

  function useUpdate(options = {}) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }) => repository.update(id, payload),
      onSuccess: (data, vars, ctx) => {
        qc.invalidateQueries({ queryKey: keys.lists() });
        if (vars?.id) qc.invalidateQueries({ queryKey: keys.detail(vars.id) });
        options.onSuccess?.(data, vars, ctx);
      },
      ...options,
    });
  }

  function useDelete(options = {}) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id) => repository.remove(id),
      onSuccess: (data, id, ctx) => {
        qc.invalidateQueries({ queryKey: keys.lists() });
        qc.removeQueries({ queryKey: keys.detail(id) });
        options.onSuccess?.(data, id, ctx);
      },
      ...options,
    });
  }

  return { keys, useList, useOne, useCreate, useUpdate, useDelete };
}
