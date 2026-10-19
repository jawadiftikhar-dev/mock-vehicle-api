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

export default memo(VehicleRow);