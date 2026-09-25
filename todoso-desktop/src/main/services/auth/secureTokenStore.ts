import { safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';

export class SecureTokenStore {
  private readonly tokenPath: string;
  private inMemoryRefreshToken: string | null = null;

  constructor(userDataPath: string) {
    this.tokenPath = path.join(userDataPath, 'session.enc');
  }

  setRefreshToken(token: string, persist: boolean = true): void {
    if (persist && safeStorage.isEncryptionAvailable()) {
      try {
        const encrypted = safeStorage.encryptString(token);
        fs.writeFileSync(this.tokenPath, encrypted);
        this.inMemoryRefreshToken = null;
      } catch (e) {
        console.error('[SecureTokenStore] Error writing encrypted token:', e);
      }
    } else {
      this.inMemoryRefreshToken = token;
    }
  }

  getRefreshToken(): string | null {
    if (this.inMemoryRefreshToken) return this.inMemoryRefreshToken;

    if (!fs.existsSync(this.tokenPath)) return null;

    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('[SecureTokenStore] Encryption not available but file exists. Cannot decrypt.');
      return null;
    }

    try {
      const encrypted = fs.readFileSync(this.tokenPath);
      return safeStorage.decryptString(encrypted);
    } catch (e) {
      console.error('[SecureTokenStore] Error decrypting token:', e);
      return null;
    }
  }

  clearRefreshToken(): void {
    this.inMemoryRefreshToken = null;
    if (fs.existsSync(this.tokenPath)) {
      try {
        fs.unlinkSync(this.tokenPath);
      } catch (e) {
        console.error('[SecureTokenStore] Error deleting token file:', e);
      }
    }
  }
}
