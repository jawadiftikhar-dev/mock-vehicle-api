import { useEffect, useRef, useState } from 'react';
import VehicleList from './VehicleList.jsx';

const API = ''; // same-origin (Vite proxy → http://localhost:3000)

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [live, setLive] = useState(false);

  // Fetch once
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/vehicles`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(list => { if (!cancelled) { setVehicles(list); setStatus('ready'); } })
      .catch(err => { if (!cancelled) { console.error(err); setStatus('error'); } });
    return () => { cancelled = true; };
  }, []);

  // Optional: subscribe to SSE to prove "keeps scroll position when new data arrives".
  // We replace the array by id; VehicleList is memoized so React reconciles cheaply.
  useEffect(() => {
    const es = new EventSource(`${API}/positions`);
    es.addEventListener('open', () => setLive(true));
    es.addEventListener('error', () => setLive(false));
    es.addEventListener('position', ev => {
      try {
        const v = JSON.parse(ev.data);
        setVehicles(prev => {
          const idx = prev.findIndex(x => x.id === v.id);
          if (idx === -1) return prev;
          const next = prev.slice();
          next[idx] = { ...prev[idx], ...v };
          return next;
        });
      } catch {}
    });
    return () => es.close();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Vehicles</h1>
          <p className="sub">
            {status === 'ready'
              ? `${vehicles.length} records · windowed with react-window`
              : status === 'loading' ? 'Loading…' : 'Failed to load'}
          </p>
        </div>
        <span className={`live-pill ${live ? 'on' : 'off'}`}>
          <span className="live-dot" /> {live ? 'Live' : 'Offline'}
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