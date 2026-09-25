import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { useTasks } from '../hooks/useTasks';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { Task } from '../types/task';

const mockTask: Task = {
  id: 1,
  owner_id: 1,
  title: 'Test Task',
  description: 'Test Desc',
  status: 'pending',
  priority: 'high',
  due_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const server = setupServer(
  http.get('http://localhost:8000/api/tasks/', () => {
    return HttpResponse.json([mockTask]);
  }),
  http.patch('http://localhost:8000/api/tasks/:id/', async ({ request }) => {
    const data = await request.json() as any;
    // Simulate error if title is "error"
    if (data.title === "error") {
      return HttpResponse.error();
    }
    return HttpResponse.json({ ...mockTask, ...data });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Task Hooks', () => {
  it('useTasks fetches successfully', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useTasks({ status: 'all', overdue: false, search: '', sortBy: 'priority' }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].title).toBe('Test Task');
  });

  it('useTasks handles network error', async () => {
    server.use(
      http.get('http://localhost:8000/api/tasks/', () => {
        return HttpResponse.error();
      })
    );

    const wrapper = createWrapper();
    const { result } = renderHook(() => useTasks({ status: 'all', overdue: false, search: '', sortBy: 'priority' }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useUpdateTask performs optimistic update and resolves', async () => {
    const wrapper = createWrapper();
    
    // First fetch
    const { result: queryResult } = renderHook(() => useTasks({ status: 'all', overdue: false, search: '', sortBy: 'priority' }), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    
    // Then mutate
    const { result: mutateResult } = renderHook(() => useUpdateTask(), { wrapper });
    
    act(() => {
      mutateResult.current.mutate({ id: 1, data: { status: 'completed' } });
    });

    // Optimistic check
    expect(queryResult.current.data![0].status).toBe('completed');
    
    await waitFor(() => expect(mutateResult.current.isSuccess).toBe(true));
  });

  it('useUpdateTask performs rollback on error', async () => {
    const wrapper = createWrapper();
    
    // First fetch
    const { result: queryResult } = renderHook(() => useTasks({ status: 'all', overdue: false, search: '', sortBy: 'priority' }), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    
    // Then mutate (force error)
    const { result: mutateResult } = renderHook(() => useUpdateTask(), { wrapper });
    
    act(() => {
      mutateResult.current.mutate({ id: 1, data: { title: 'error', status: 'completed' } });
    });

    // Optimistic check
    expect(queryResult.current.data![0].status).toBe('completed');
    
    await waitFor(() => expect(mutateResult.current.isError).toBe(true));
    
    // Rollback check
    expect(queryResult.current.data![0].status).toBe('pending');
  });
});
