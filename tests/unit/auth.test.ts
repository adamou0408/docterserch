// Test: specs/hospital-clinic-map-search/tasks.md — Task 8 (unit test)

import { authenticateAdmin } from '../../src/src/lib/auth';
import { NextRequest } from 'next/server';

describe('authenticateAdmin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_TOKEN: 'test-token-123' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null (success) with valid token', () => {
    const request = new NextRequest('http://localhost/api/admin/crawl-status', {
      headers: { authorization: 'Bearer test-token-123' },
    });
    const result = authenticateAdmin(request);
    expect(result).toBeNull();
  });

  it('should return 401 when no authorization header', () => {
    const request = new NextRequest('http://localhost/api/admin/crawl-status');
    const result = authenticateAdmin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('should return 401 when token is wrong', () => {
    const request = new NextRequest('http://localhost/api/admin/crawl-status', {
      headers: { authorization: 'Bearer wrong-token' },
    });
    const result = authenticateAdmin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('should return 401 when authorization header is not Bearer format', () => {
    const request = new NextRequest('http://localhost/api/admin/crawl-status', {
      headers: { authorization: 'Basic test-token-123' },
    });
    const result = authenticateAdmin(request);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });
});
