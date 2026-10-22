import { memo } from 'react';
import StatusIcon from './StatusIcon.jsx';

function VehicleRow({ vehicle, style, onOpen }) {
  const { id, plate, driver, status, lat, lng } = vehicle;
  return (
    <div
      className="row"
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${plate}, driver ${driver}, status ${status}`}
      onClick={() => onOpen(id)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(id); }
      }}
    >
      <span className="cell plate" aria-hidden="true">{plate}</span>
      <span className="cell driver">{driver}</span>
      <span className="cell">
        <span className={`badge s-${status}`}>
          <StatusIcon status={status} />
          {status}
        </span>
      </span>
      <span className="cell coords">
        {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
      </span>
    </div>
  );
}

// Memoize on data only. `onOpen` should be stable (from App via useCallback)
// so it never causes a re-render. Comparing fields is still required because
// react-window hands the renderer a fresh style object each frame.
function areEqual(prev, next) {
  const a = prev.vehicle, b = next.vehicle;
  return (
    a.id === b.id && a.plate === b.plate && a.driver === b.driver &&
    a.status === b.status && a.lat === b.lat && a.lng === b.lng
  );
}

export default memo(VehicleRow, areEqual);