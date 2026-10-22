import { useEffect, useRef } from 'react';

const MAPBOX_TOKEN = 'pk.PLACEHOLDER_REPLACE_WITH_PUBLIC_TOKEN';
const MAP_W = 640;
const MAP_H = 240;

function staticMapUrl(lat, lng) {
  // Mapbox Static Images API placeholder. Without a valid token Mapbox
  // returns a grey "access token required" image — which is fine for the
  // review, since the task explicitly says "static map image (placeholder)".
  const pin = `pin-s+2563eb(${lng},${lat})`;
  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${pin}/${lng},${lat},12/${MAP_W}x${MAP_H}@2x` +
    `?access_token=${MAPBOX_TOKEN}`
  );
}

export default function DetailPanel({ vehicle, onClose, onMarkAttended, pendingCount }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const prevFocusRef = useRef(null);

  // Focus trap + restore
  useEffect(() => {
    if (!vehicle) return;
    prevFocusRef.current = document.activeElement;
    closeRef.current?.focus();

    const onKeyDown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      prevFocusRef.current?.focus?.();
    };
  }, [vehicle, onClose]);

  if (!vehicle) return null;
  const { id, plate, driver, status, lat, lng } = vehicle;

  return (
    <>
      <div className="dp-backdrop" onClick={onClose} aria-hidden="true" />

      <aside
        className="dp-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        ref={panelRef}
      >
        <header className="dp-head">
          <h2 id="dp-title">Vehicle details</h2>
          <button
            ref={closeRef}
            type="button"
            className="dp-close"
            onClick={onClose}
            aria-label="Close details panel"
          >✕</button>
        </header>

        <div className="dp-body">
          <div className="dp-map">
            <img
              src={staticMapUrl(lat, lng)}
              width={MAP_W / 2}
              height={MAP_H / 2}
              alt={`Static map showing vehicle ${plate} near ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
              loading="lazy"
            />
            <span className="dp-map-hint">Static map preview · Mapbox placeholder</span>
          </div>

          <dl className="dp-grid">
            <div><dt>ID</dt><dd>#{id}</dd></div>
            <div><dt>Plate</dt><dd><span className="plate">{plate}</span></dd></div>
            <div><dt>Driver</dt><dd>{driver}</dd></div>
            <div>
              <dt>Status</dt>
              <dd><span className={`badge s-${status}`}>{status}</span></dd>
            </div>
            <div className="dp-wide">
              <dt>Last known location</dt>
              <dd className="dp-coords">
                <code>{lat.toFixed(6)}, {lng.toFixed(6)}</code>
              </dd>
            </div>
          </dl>

          {pendingCount > 0 && (
            <p className="dp-queued">
              {pendingCount} action{pendingCount === 1 ? '' : 's'} queued for sync.
            </p>
          )}
        </div>

        <footer className="dp-foot">
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onMarkAttended(vehicle)}
          >
            Mark as attended
          </button>
        </footer>
      </aside>
    </>
  );
}