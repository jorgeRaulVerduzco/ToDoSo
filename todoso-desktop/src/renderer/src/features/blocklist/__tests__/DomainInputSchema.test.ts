import { describe, it, expect } from 'vitest';
import { DomainInputSchema } from '../types/blockedSite';

describe('DomainInputSchema', () => {
  it('normalizes https:// and www', () => {
    const result = DomainInputSchema.parse({ domain: 'https://www.facebook.com' });
    expect(result.domain).toBe('facebook.com');
  });

  it('normalizes http://', () => {
    const result = DomainInputSchema.parse({ domain: 'http://facebook.com' });
    expect(result.domain).toBe('facebook.com');
  });

  it('removes trailing paths', () => {
    const result = DomainInputSchema.parse({ domain: 'youtube.com/watch?v=123' });
    expect(result.domain).toBe('youtube.com');
  });

  it('allows normal domains', () => {
    const result = DomainInputSchema.parse({ domain: 'mi-dominio.com.mx' });
    expect(result.domain).toBe('mi-dominio.com.mx');
  });

  it('rejects invalid formats', () => {
    const res = DomainInputSchema.safeParse({ domain: 'no-es-dominio' });
    expect(res.success).toBe(false);
  });
});
