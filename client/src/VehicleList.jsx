import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import VehicleRow from './VehicleRow.jsx';

const ROW_HEIGHT = 56;

// Module-level renderer → same function identity across renders.
// react-window calls it only for rows inside the viewport (+ overscan).
function RowRenderer({ index, style, data }) {
  return <VehicleRow vehicle={data[index]} style={style} />;
}

function VehicleList({ vehicles, height = 600, itemHeight = ROW_HEIGHT }) {
  return (
    <div className="vlist" role="region" aria-label="Vehicles">
      <div className="vlist-head" aria-hidden="true">
        <span>Plate</span>
        <span>Driver</span>
        <span>Status</span>
        <span>Coordinates</span>
      </div>

      <List
        height={height}
        itemCount={vehicles.length}
        itemSize={itemHeight}
        itemData={vehicles}
        width="100%"
        overscanCount={6}
      >
        {RowRenderer}
      </List>
    </div>
  );
}

export default memo(VehicleList);