// vehicleFilter.js
export const STATUSES = ['all', 'active', 'idle', 'offline', 'maintenance'];

export const SORT_DIRS = ['asc', 'desc'];

/** Validate/normalise URL-provided values. Bad values fall back to defaults. */
export function normalizeStatus(value) {
  return STATUSES.includes(value) ? value : 'all';
}

export function normalizeSort(value) {
  return SORT_DIRS.includes(value) ? value : 'asc';
}

/**
 * Filter by status, then sort by driver name.
 * Returns a new array; never mutates the input.
 */
export function filterAndSort(vehicles, { status = 'all', sort = 'asc' } = {}) {
  const filtered = status === 'all'
    ? vehicles
    : vehicles.filter(v => v.status === status);

  const dir = sort === 'desc' ? -1 : 1;

  // Slice before sort so we don't mutate the input array
  return filtered.slice().sort((a, b) => {
    const cmp = a.driver.localeCompare(b.driver, undefined, { sensitivity: 'base' });
    if (cmp !== 0) return cmp * dir;
    // Stable tiebreaker: id ascending, independent of sort direction,
    // so equal-driver rows don't flip-flop between renders.
    return a.id - b.id;
  });
}