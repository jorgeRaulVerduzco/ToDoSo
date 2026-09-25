import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import { TokenPair } from '../types/auth';

// Mock global electronAPI
global.window = Object.create(window);
const mockSetRefreshToken = vi.fn();
const mockClearRefreshToken = vi.fn();
(window as any).electronAPI = {
  auth: {
    setRefreshToken: mockSetRefreshToken,
    clearRefreshToken: mockClearRefreshToken,
  }
};

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      accessToken: null,
      isAuthenticated: false,
      isInitializing: true,
      rememberMe: true
    });
  });

  it('setSession updates state and calls IPC with rememberMe=true', async () => {
    const tokens: TokenPair = { access: 'acc', refresh: 'ref' };
    
    await useAuthStore.getState().setSession(tokens, true);
    
    expect(mockSetRefreshToken).toHaveBeenCalledWith('ref', true);
    
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('acc');
    expect(state.isAuthenticated).toBe(true);
    expect(state.rememberMe).toBe(true);
    expect(state.isInitializing).toBe(false);
  });

  it('setSession calls IPC with rememberMe=false', async () => {
    const tokens: TokenPair = { access: 'acc', refresh: 'ref' };
    
    await useAuthStore.getState().setSession(tokens, false);
    
    expect(mockSetRefreshToken).toHaveBeenCalledWith('ref', false);
    
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('acc');
    expect(state.isAuthenticated).toBe(true);
    expect(state.rememberMe).toBe(false);
  });

  it('logout clears state and calls IPC', async () => {
    useAuthStore.setState({ accessToken: 'acc', isAuthenticated: true });
    
    await useAuthStore.getState().logout();
    
    expect(mockClearRefreshToken).toHaveBeenCalled();
    
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isInitializing).toBe(false);
  });
});
