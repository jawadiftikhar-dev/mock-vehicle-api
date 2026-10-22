import { useCallback, useEffect, useMemo, useState } from 'react';
import VehicleList from './VehicleList.jsx';
import DetailPanel from './DetailPanel.jsx';
import OfflineBanner from './OfflineBanner.jsx';
import useVehicleUpdates from './useVehicleUpdates.js';
import useSearchParams from './useSearchParams.js';
import useOnlineQueue from './useOnlineQueue.js';
import StatusFilter from './StatusFilter.jsx';
import SortControl from './SortControl.jsx';
import { filterAndSort, normalizeStatus, normalizeSort } from './vehicleFilter.js';

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState('loading');
  const [selectedId, setSelectedId] = useState(null);

  const [params, setParams] = useSearchParams();
  const statusFilter = normalizeStatus(params.get('status'));
  const sortDir      = normalizeSort(params.get('sort'));

  useEffect(() => {
    let cancelled = false;
    fetch('/vehicles')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(list => { if (!cancelled) { setVehicles(list); setStatus('ready'); } })
      .catch(err => { if (!cancelled) { console.error(err); setStatus('error'); } });
    return () => { cancelled = true; };
  }, []);

  const handleVehicleUpdate = useCallback(incoming => {
    setVehicles(prev => {
      const idx = prev.findIndex(v => v.id === incoming.id);
      if (idx === -1) return prev;
      const p = prev[idx];
      if (p.lat === incoming.lat && p.lng === incoming.lng &&
          p.status === incoming.status && p.driver === incoming.driver &&
          p.plate === incoming.plate) return prev;
      const next = prev.slice();
      next[idx] = { ...p, ...incoming };
      return next;
    });
  }, []);

  const { online } = useVehicleUpdates(handleVehicleUpdate);
  const { enqueue, pendingCount, syncStatus } = useOnlineQueue(online);

  const visible = useMemo(
    () => filterAndSort(vehicles, { status: statusFilter, sort: sortDir }),
    [vehicles, statusFilter, sortDir],
  );

  const setStatusFilter = useCallback(v => setParams(prev => {
    const n = new URLSearchParams(prev);
    v === 'all' ? n.delete('status') : n.set('status', v);
    return n;
  }), [setParams]);

  const setSortDir = useCallback(v => setParams(prev => {
    const n = new URLSearchParams(prev);
    v === 'asc' ? n.delete('sort') : n.set('sort', v);
    return n;
  }), [setParams]);

  const openRow = useCallback(id => setSelectedId(id), []);
  const closePanel = useCallback(() => setSelectedId(null), []);

  const selected = selectedId != null
    ? vehicles.find(v => v.id === selectedId)
    : null;

  const markAttended = useCallback(async vehicle => {
    const action = {
      type: 'mark-attended',
      vehicleId: vehicle.id,
      plate: vehicle.plate,
      at: new Date().toISOString(),
    };
    if (online) {
      try {
        const r = await fetch('/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action),
        });
        if (!r.ok) throw new Error(r.status);
      } catch (e) {
        console.warn('direct POST failed, queueing', e);
        await enqueue(action);
      }
    } else {
      await enqueue(action);
    }
  }, [online, enqueue]);

  return (
    <div className="app">
      <OfflineBanner
        visible={!online}
        pendingCount={pendingCount}
        syncStatus={syncStatus}
      />

      <header className="app-header">
        <div>
          <h1>Vehicles</h1>
          <p className="sub">
            {status === 'ready'
              ? `${visible.length} of ${vehicles.length} shown · windowed · live via SSE`
              : status === 'loading' ? 'Loading…' : 'Failed to load'}
          </p>
        </div>
        <span className={`live-pill ${online ? 'on' : 'off'}`}>
          <span className="live-dot" /> {online ? 'Live' : 'Offline'}
        </span>
      </header>

      <section className="toolbar" role="toolbar" aria-label="Filters">
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
        <SortControl   value={sortDir}      onChange={setSortDir} />
        {pendingCount > 0 && (
          <span className="queue-pill" aria-live="polite">
            {pendingCount} queued
          </span>
        )}
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
          <VehicleList vehicles={visible} onOpen={openRow} height={600} />
        )}
        {status === 'loading' && <div className="skeleton" aria-hidden="true" />}
      </main>

      <DetailPanel
        vehicle={selected}
        onClose={closePanel}
        onMarkAttended={markAttended}
        pendingCount={pendingCount}
      />
    </div>
  );
}