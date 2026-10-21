import { useCallback, useEffect, useMemo, useState } from 'react';
import VehicleList from './VehicleList.jsx';
import useVehicleUpdates from './useVehicleUpdates.js';
import useSearchParams from './useSearchParams.js';
import StatusFilter from './StatusFilter.jsx';
import SortControl from './SortControl.jsx';
import { filterAndSort, normalizeStatus, normalizeSort } from './vehicleFilter.js';

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  // URL is the source of truth for filter/sort
  const [params, setParams] = useSearchParams();
  const statusFilter = normalizeStatus(params.get('status'));
  const sortDir      = normalizeSort(params.get('sort'));

  // Fetch initial list once
  useEffect(() => {
    let cancelled = false;
    fetch('/vehicles')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(list => { if (!cancelled) { setVehicles(list); setStatus('ready'); } })
      .catch(err => { if (!cancelled) { console.error(err); setStatus('error'); } });
    return () => { cancelled = true; };
  }, []);

  // SSE: replace exactly one slot (Task 3 logic, unchanged)
  const handleVehicleUpdate = useCallback(incoming => {
    setVehicles(prev => {
      const idx = prev.findIndex(v => v.id === incoming.id);
      if (idx === -1) return prev;
      const prevV = prev[idx];
      if (
        prevV.lat === incoming.lat &&
        prevV.lng === incoming.lng &&
        prevV.status === incoming.status &&
        prevV.driver === incoming.driver &&
        prevV.plate === incoming.plate
      ) return prev;
      const next = prev.slice();
      next[idx] = { ...prevV, ...incoming };
      return next;
    });
  }, []);
  const { status: sseStatus } = useVehicleUpdates(handleVehicleUpdate);

  // Derived list — recomputes only when the data or filter/sort changes
  const visible = useMemo(
    () => filterAndSort(vehicles, { status: statusFilter, sort: sortDir }),
    [vehicles, statusFilter, sortDir],
  );

  const setStatusFilter = useCallback(value => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'all') next.delete('status');
      else next.set('status', value);
      return next;
    });
  }, [setParams]);

  const setSortDir = useCallback(value => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === 'asc') next.delete('sort');
      else next.set('sort', value);
      return next;
    });
  }, [setParams]);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Vehicles</h1>
          <p className="sub">
            {status === 'ready'
              ? `${visible.length} of ${vehicles.length} shown · windowed with react-window`
              : status === 'loading' ? 'Loading…' : 'Failed to load'}
          </p>
        </div>
        <span className={`live-pill ${sseStatus === 'open' ? 'on' : 'off'}`}>
          <span className="live-dot" /> {sseStatus}
        </span>
      </header>

      <section className="toolbar" role="toolbar" aria-label="Filters">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <SortControl   value={sortDir}      onChange={setSortDir} />
        <span className="url-echo" aria-live="polite">
          <code>{buildSearchString(statusFilter, sortDir) || '(no filters)'}</code>
        </span>
      </section>

      <main className="app-main">
        {status === 'error' && (
          <div className="err">
            Could not reach the mock API. Start Task 1 with <code>npm start</code> in the repo root, then reload.
          </div>
        )}
        {status === 'ready' && visible.length === 0 && (
          <div className="empty">No vehicles match the current filter.</div>
        )}
        {status === 'ready' && visible.length > 0 && (
          <VehicleList vehicles={visible} height={600} />
        )}
        {status === 'loading' && <div className="skeleton" aria-hidden="true" />}
      </main>
    </div>
  );
}

function buildSearchString(status, sort) {
  const p = new URLSearchParams();
  if (status !== 'all') p.set('status', status);
  if (sort !== 'asc')   p.set('sort', sort);
  const s = p.toString();
  return s ? '?' + s : '';
}