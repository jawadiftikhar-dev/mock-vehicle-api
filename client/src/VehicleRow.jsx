import { memo } from 'react';
import StatusIcon from './StatusIcon.jsx';

function VehicleRow({ vehicle, style }) {
  const { plate, driver, status, lat, lng } = vehicle;

  return (
    <div
      className="row"
      style={style}
      role="listitem"
      aria-label={`${plate}, driver ${driver}, status ${status}`}
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

function areEqual(prev, next) {
  // Skip re-render if the vehicle data and layout style are unchanged.
  if (prev.style !== next.style) return false;   // react-window may pass a new style object
  const a = prev.vehicle;
  const b = next.vehicle;
  return (
    a.id === b.id &&
    a.plate === b.plate &&
    a.driver === b.driver &&
    a.status === b.status &&
    a.lat === b.lat &&
    a.lng === b.lng
  );
}

export default memo(VehicleRow, areEqual);