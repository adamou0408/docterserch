// Test: specs/hospital-clinic-map-search/tasks.md — Task 4 (unit test)

import { validateSearchParams } from '../../src/src/lib/validation';

describe('validateSearchParams', () => {
  it('should pass with valid required params', () => {
    const params = new URLSearchParams({ lat: '25.033', lng: '121.565' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(true);
    expect(result.parsed).not.toBeNull();
    expect(result.parsed!.lat).toBe(25.033);
    expect(result.parsed!.lng).toBe(121.565);
    expect(result.parsed!.radius).toBe(3000); // default
    expect(result.parsed!.limit).toBe(50); // default
    expect(result.parsed!.offset).toBe(0); // default
  });

  it('should fail when lat is missing', () => {
    const params = new URLSearchParams({ lng: '121.565' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'lat')).toBe(true);
  });

  it('should fail when lng is missing', () => {
    const params = new URLSearchParams({ lat: '25.033' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'lng')).toBe(true);
  });

  it('should fail when lat is out of Taiwan range', () => {
    const params = new URLSearchParams({ lat: '30.0', lng: '121.565' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'lat')).toBe(true);
  });

  it('should fail when lng is out of Taiwan range', () => {
    const params = new URLSearchParams({ lat: '25.033', lng: '130.0' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'lng')).toBe(true);
  });

  it('should fail when radius exceeds maximum', () => {
    const params = new URLSearchParams({ lat: '25.033', lng: '121.565', radius: '60000' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'radius')).toBe(true);
  });

  it('should parse departments correctly', () => {
    const params = new URLSearchParams({
      lat: '25.033',
      lng: '121.565',
      departments: 'dept-1,dept-2',
    });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(true);
    expect(result.parsed!.departments).toEqual(['dept-1', 'dept-2']);
  });

  it('should fail with invalid sort value', () => {
    const params = new URLSearchParams({
      lat: '25.033',
      lng: '121.565',
      sort: 'invalid',
    });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'sort')).toBe(true);
  });

  it('should accept valid sort values', () => {
    for (const sort of ['distance', 'next_available']) {
      const params = new URLSearchParams({ lat: '25.033', lng: '121.565', sort });
      const result = validateSearchParams(params);
      expect(result.valid).toBe(true);
      expect(result.parsed!.sort).toBe(sort);
    }
  });

  it('should fail when limit exceeds maximum', () => {
    const params = new URLSearchParams({ lat: '25.033', lng: '121.565', limit: '300' });
    const result = validateSearchParams(params);
    expect(result.valid).toBe(false);
  });
});
