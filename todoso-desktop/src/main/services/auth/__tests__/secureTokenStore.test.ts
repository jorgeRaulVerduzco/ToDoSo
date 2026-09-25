import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecureTokenStore } from '../secureTokenStore';
import fs from 'fs';
import path from 'path';

// Mock electron
vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: vi.fn(),
    encryptString: vi.fn(),
    decryptString: vi.fn()
  }
}));

import { safeStorage } from 'electron';

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn()
  }
}));

describe('SecureTokenStore', () => {
  const userDataPath = '/mock/user/data';
  const tokenPath = path.join(userDataPath, 'session.enc');
  let store: SecureTokenStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new SecureTokenStore(userDataPath);
  });

  describe('When encryption is available', () => {
    beforeEach(() => {
      (safeStorage.isEncryptionAvailable as any).mockReturnValue(true);
    });

    it('encrypts and writes token to disk when persist is true', () => {
      (safeStorage.encryptString as any).mockReturnValue(Buffer.from('encrypted'));
      
      store.setRefreshToken('my-token', true);
      
      expect(safeStorage.encryptString).toHaveBeenCalledWith('my-token');
      expect(fs.writeFileSync).toHaveBeenCalledWith(tokenPath, Buffer.from('encrypted'));
      
      // Memory token should be null
      (fs.existsSync as any).mockReturnValue(false); 
      expect(store.getRefreshToken()).toBeNull();
    });

    it('only stores in memory when persist is false', () => {
      store.setRefreshToken('my-memory-token', false);
      
      expect(safeStorage.encryptString).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      
      expect(store.getRefreshToken()).toBe('my-memory-token');
    });

    it('decrypts token from disk', () => {
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(Buffer.from('encrypted'));
      (safeStorage.decryptString as any).mockReturnValue('decrypted-token');
      
      const token = store.getRefreshToken();
      
      expect(fs.existsSync).toHaveBeenCalledWith(tokenPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(tokenPath);
      expect(safeStorage.decryptString).toHaveBeenCalledWith(Buffer.from('encrypted'));
      expect(token).toBe('decrypted-token');
    });
  });

  describe('When encryption is NOT available', () => {
    beforeEach(() => {
      (safeStorage.isEncryptionAvailable as any).mockReturnValue(false);
    });

    it('does not write to disk even if persist is true, keeps in memory', () => {
      store.setRefreshToken('my-token', true);
      
      expect(safeStorage.encryptString).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      
      expect(store.getRefreshToken()).toBe('my-token');
    });

    it('returns null if trying to read from disk without encryption', () => {
      (fs.existsSync as any).mockReturnValue(true);
      
      const token = store.getRefreshToken();
      
      expect(safeStorage.decryptString).not.toHaveBeenCalled();
      expect(token).toBeNull();
    });
  });

  describe('clearRefreshToken', () => {
    it('clears memory and deletes file if it exists', () => {
      (fs.existsSync as any).mockReturnValue(true);
      
      store.setRefreshToken('memory', false);
      store.clearRefreshToken();
      
      expect(fs.unlinkSync).toHaveBeenCalledWith(tokenPath);
      
      (fs.existsSync as any).mockReturnValue(false);
      expect(store.getRefreshToken()).toBeNull();
    });
  });
});
