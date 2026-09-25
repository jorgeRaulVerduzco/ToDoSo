import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { useBlockedSites } from '../hooks/useBlockedSites';
import { useToggleSite } from '../hooks/useToggleSite';
import { useAddPreset } from '../hooks/useAddPreset';
import { BlockedSite } from '../types/blockedSite';

const mockSite: BlockedSite = {
  id: 1,
  owner_id: 1,
  domain: 'facebook.com',
  is_active: true,
};

let db: BlockedSite[] = [mockSite];

const server = setupServer(
  http.get('http://localhost:8000/api/blocked-sites/', () => {
    return HttpResponse.json(db);
  }),
  http.patch('http://localhost:8000/api/blocked-sites/:id/', async ({ request, params }) => {
    const data = await request.json() as any;
    if (data.is_active === false && params.id === "999") { // simulate error
       return HttpResponse.error();
    }
    db = db.map(s => s.id === Number(params.id) ? { ...s, is_active: data.is_active } : s);
    return HttpResponse.json(db.find(s => s.id === Number(params.id)));
  }),
  http.post('http://localhost:8000/api/blocked-sites/', async ({ request }) => {
    const data = await request.json() as any;
    // Simulate error/conflict if domain already exists
    if (db.some(s => s.domain === data.domain)) {
        return new HttpResponse(null, { status: 409 });
    }
    const newSite = { id: db.length + 1, owner_id: 1, domain: data.domain, is_active: true };
    db.push(newSite);
    return HttpResponse.json(newSite);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  db = [{ ...mockSite }]; // reset DB
});
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

describe('Blocklist Hooks', () => {
  it('useToggleSite performs optimistic update', async () => {
    const wrapper = createWrapper();
    
    const { result: queryResult } = renderHook(() => useBlockedSites(), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    
    const { result: mutateResult } = renderHook(() => useToggleSite(), { wrapper });
    
    act(() => {
      mutateResult.current.mutate({ id: 1, is_active: false });
    });

    // Optimistic check
    expect(queryResult.current.data![0].is_active).toBe(false);
    
    await waitFor(() => expect(mutateResult.current.isSuccess).toBe(true));
  });

  it('useToggleSite rolls back on error', async () => {
    const wrapper = createWrapper();
    
    // add fake site to mock error
    db.push({ id: 999, owner_id: 1, domain: 'error.com', is_active: true });
    
    const { result: queryResult } = renderHook(() => useBlockedSites(), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    
    const { result: mutateResult } = renderHook(() => useToggleSite(), { wrapper });
    
    act(() => {
      mutateResult.current.mutate({ id: 999, is_active: false });
    });

    // Optimistic check
    expect(queryResult.current.data!.find(s => s.id === 999)!.is_active).toBe(false);
    
    await waitFor(() => expect(mutateResult.current.isError).toBe(true));
    
    // Rollback check
    expect(queryResult.current.data!.find(s => s.id === 999)!.is_active).toBe(true);
  });

  it('useAddPreset only adds missing domains', async () => {
    const wrapper = createWrapper();
    
    // DB has facebook.com already
    const { result: queryResult } = renderHook(() => useBlockedSites(), { wrapper });
    await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
    
    const { result: mutateResult } = renderHook(() => useAddPreset(), { wrapper });
    
    // Add "redesSociales" preset which includes facebook.com (so 1 already exists, 4 missing)
    let addResult;
    await act(async () => {
      addResult = await mutateResult.current.mutateAsync('redesSociales');
    });

    expect(addResult).toEqual({
      added: 4,
      total: 5,
      alreadyExisted: 1
    });

    // Verify they are in the DB via refetch
    await waitFor(() => expect(queryResult.current.data!.length).toBe(5));
  });
});
