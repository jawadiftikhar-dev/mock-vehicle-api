import { describe, it, expect } from 'vitest';
import {
  filterAndSort,
  normalizeStatus,
  normalizeSort,
  STATUSES,
  SORT_DIRS,
} from './vehicleFilter.js';

const V = [
  { id: 1, plate: 'AA-1', driver: 'Charlie', status: 'active',   lat: 1, lng: 1 },
  { id: 2, plate: 'BB-2', driver: 'alice',   status: 'idle',     lat: 2, lng: 2 },
  { id: 3, plate: 'CC-3', driver: 'Bob',     status: 'active',   lat: 3, lng: 3 },
  { id: 4, plate: 'DD-4', driver: 'Alice',   status: 'offline',  lat: 4, lng: 4 },
  { id: 5, plate: 'EE-5', driver: 'dave',    status: 'idle',     lat: 5, lng: 5 },
];

describe('filterAndSort — status filter', () => {
  it('returns all vehicles when status is "all"', () => {
    const out = filterAndSort(V, { status: 'all', sort: 'asc' });
    expect(out).toHaveLength(5);
  });

  it('keeps only the requested status', () => {
    const out = filterAndSort(V, { status: 'active', sort: 'asc' });
    expect(out.map(v => v.id).sort()).toEqual([1, 3]);
    expect(out.every(v => v.status === 'active')).toBe(true);
  });

  it('returns an empty array when no vehicle matches the status', () => {
    const out = filterAndSort(V, { status: 'maintenance', sort: 'asc' });
    expect(out).toEqual([]);
  });
});

describe('filterAndSort — driver sort', () => {
  it('sorts by driver ascending, case-insensitively', () => {
    const out = filterAndSort(V, { status: 'all', sort: 'asc' });
    // alice/Alice (base-insensitive), Bob, Charlie, dave
    expect(out.map(v => v.driver.toLowerCase())).toEqual(['alice', 'alice', 'bob', 'charlie', 'dave']);
  });

  it('sorts descending', () => {
    const out = filterAndSort(V, { status: 'all', sort: 'desc' });
    expect(out.map(v => v.driver.toLowerCase())).toEqual(['dave', 'charlie', 'bob', 'alice', 'alice']);
  });

  it('keeps equal-driver rows in stable id-ascending order regardless of sort direction', () => {
    const asc  = filterAndSort(V, { status: 'all', sort: 'asc'  }).filter(v => v.driver.toLowerCase() === 'alice');
    const desc = filterAndSort(V, { status: 'all', sort: 'desc' }).filter(v => v.driver.toLowerCase() === 'alice');
    expect(asc.map(v => v.id)).toEqual([2, 4]);
    expect(desc.map(v => v.id)).toEqual([2, 4]);
  });
});

describe('filterAndSort — invariants', () => {
  it('does not mutate the input array', () => {
    const original = V.map(v => ({ ...v }));
    filterAndSort(V, { status: 'active', sort: 'desc' });
    expect(V).toEqual(original);
  });

  it('combines filter + sort: only active, sorted by driver', () => {
    const out = filterAndSort(V, { status: 'active', sort: 'asc' });
    expect(out.map(v => v.driver.toLowerCase())).toEqual(['bob', 'charlie']);
  });
});

describe('normalizers', () => {
  it('accepts known statuses and rejects unknown ones', () => {
    for (const s of STATUSES) expect(normalizeStatus(s)).toBe(s);
    expect(normalizeStatus('bogus')).toBe('all');
    expect(normalizeStatus(undefined)).toBe('all');
  });

  it('accepts known sort directions and rejects unknown ones', () => {
    for (const d of SORT_DIRS) expect(normalizeSort(d)).toBe(d);
    expect(normalizeSort('sideways')).toBe('asc');
    expect(normalizeSort(null)).toBe('asc');
  });
});