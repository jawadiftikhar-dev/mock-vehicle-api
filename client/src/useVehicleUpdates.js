import { useEffect, useRef, useState } from 'react';

/**
 * Subscribes to the /positions SSE stream.
 *
 * @param {(vehicle: object) => void} onVehicleUpdate  called for every `position` event
 * @returns {{ status: 'connecting' | 'open' | 'reconnecting' | 'closed' }}
 */
export default function useVehicleUpdates(onVehicleUpdate) {
  const [status, setStatus] = useState('connecting');
  const cbRef = useRef(onVehicleUpdate);
  cbRef.current = onVehicleUpdate;   // keep latest without reopening the stream

  useEffect(() => {
    let es = null;
    let retryTimer = null;
    let attempt = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');

      es = new EventSource('/positions');

      es.addEventListener('open', () => {
        attempt = 0;
        setStatus('open');
      });

      es.addEventListener('position', ev => {
        let payload;
        try { payload = JSON.parse(ev.data); } catch { return; }
        cbRef.current?.(payload);
      });

      es.addEventListener('error', () => {
        // EventSource tries to reconnect on its own for transient drops,
        // but if it fully closes (server down / 4xx) we should retry manually.
        if (es.readyState === EventSource.CLOSED) {
          setStatus('reconnecting');
          es.close();
          const delay = Math.min(30_000, 1000 * 2 ** attempt); // 1s, 2s, 4s, … max 30s
          attempt += 1;
          retryTimer = setTimeout(connect, delay);
        } else {
          // transient — browser is already retrying
          setStatus('reconnecting');
        }
      });
    };

    connect();

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      es?.close();
      setStatus('closed');
    };
  }, []);

  return { status };
}