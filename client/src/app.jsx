import { useCallback, useEffect, useState } from 'react';
import VehicleList from './VehicleList.jsx';
import useVehicleUpdates from './useVehicleUpdates.jsx';

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  // Fetch initial list once
  useEffect(() => {
    let cancelled = false;
    fetch('/vehicles')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(list => {
        if (cancelled) return;
        setVehicles(list);
        setStatus('ready');
      })
      .catch(err => {
        if (cancelled) return;
        console.error(err);
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  // Stable callback (identity never changes) so the hook can ignore it in deps
  const handleVehicleUpdate = useCallback(incoming => {
    setVehicles(prev => {
      // Find by id. For 400 items this is fine; if it ever grew we'd use a Map.
      const idx = prev.findIndex(v => v.id === incoming.id);
      if (idx === -1) return prev;

      // No-op short-circuit: if nothing actually changed, don't churn state.
      const prevV = prev[idx];
      if (
        prevV.lat === incoming.lat &&
        prevV.lng === incoming.lng &&
        prevV.status === incoming.status &&
        prevV.driver === incoming.driver &&
        prevV.plate === incoming.plate
      ) {
        return prev;
      }

      // Replace only the changed slot. All other object references stay
      // identical, so React.memo(VehicleRow) skips them.
      const next = prev.slice();
      next[idx] = { ...prevV, ...incoming };
      return next;
    });
  }, []);

  const { status: sseStatus } = useVehicleUpdates(handleVehicleUpdate);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Vehicles</h1>
          <p className="sub">
            {status === 'ready'
              ? `${vehicles.length} records · windowed with react-window · live via SSE`
              : status === 'loading' ? 'Loading…' : 'Failed to load'}
          </p>
        </div>
        <span className={`live-pill ${sseStatus === 'open' ? 'on' : 'off'}`}>
          <span className="live-dot" /> {sseStatus}
        </span>
      </header>

      <main className="app-main">
        {status === 'error' && (
          <div className="err">
            Could not reach the mock API. Start Task 1 with <code>npm start</code> in the repo root, then reload.
          </div>
        )}
        {status === 'ready' && <VehicleList vehicles={vehicles} height={600} />}
        {status === 'loading' && <div className="skeleton" aria-hidden="true" />}
      </main>
    </div>
  );
}