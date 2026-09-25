import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { api } from '../../../services/api';
import { useAuthStore } from '../authStore';

const mockGetRefreshToken = vi.fn();
(window as any).electronAPI = {
  auth: {
    getRefreshToken: mockGetRefreshToken,
    setRefreshToken: vi.fn(),
    clearRefreshToken: vi.fn()
  }
};

let callCount = 0;

const server = setupServer(
  http.get('http://localhost:8000/api/protected/', () => {
    callCount++;
    if (callCount === 1) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json({ success: true });
  }),
  http.post('http://localhost:8000/api/auth/refresh/', async ({ request }) => {
    const data = await request.json() as any;
    if (data.refresh === 'valid-refresh') {
      return HttpResponse.json({ access: 'new-access', refresh: 'new-refresh' });
    }
    return new HttpResponse(null, { status: 401 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  callCount = 0;
  vi.clearAllMocks();
});
afterAll(() => server.close());

describe('httpClient interceptors (Refresh Logic)', () => {
  it('retries request on 401 with new token if refresh is successful', async () => {
    mockGetRefreshToken.mockResolvedValue('valid-refresh');
    useAuthStore.setState({ accessToken: 'old-access' });

    const response = await api.get('/protected/');
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Check that store was updated
    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(callCount).toBe(2); // First failed, second succeeded
  });

  it('calls logout if refresh fails', async () => {
    mockGetRefreshToken.mockResolvedValue('invalid-refresh');
    useAuthStore.setState({ accessToken: 'old-access', isAuthenticated: true });

    await expect(api.get('/protected/')).rejects.toThrow();
    
    // Check that store was cleared
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
