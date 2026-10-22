import { useEffect, useRef, useState } from 'react';
import { apiUrl } from './api.js';

export default function useVehicleUpdates(onVehicleUpdate) {
  const [status, setStatus] = useState('connecting');
  const cbRef = useRef(onVehicleUpdate);
  cbRef.current = onVehicleUpdate;

  useEffect(() => {
    let es = null;
    let retryTimer = null;
    let attempt = 0;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setStatus(attempt === 0 ? 'connecting' : 'reconnecting');
      es = new EventSource(apiUrl('/positions'));

      es.addEventListener('open', () => { attempt = 0; setStatus('open'); });
      es.addEventListener('position', ev => {
        try { cbRef.current?.(JSON.parse(ev.data)); } catch {}
      });
      es.addEventListener('error', () => {
        if (es.readyState === EventSource.CLOSED) {
          setStatus('reconnecting');
          es.close();
          const delay = Math.min(30_000, 1000 * 2 ** attempt);
          attempt += 1;
          retryTimer = setTimeout(connect, delay);
        } else {
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

  return { status, online: status === 'open' };
}