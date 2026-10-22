import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import VehicleRow from './VehicleRow.jsx';

const ROW_HEIGHT = 56;

function VehicleList({ vehicles, onOpen, height = 600, itemHeight = ROW_HEIGHT }) {
  // itemData carries both the array and the click handler so react-window
  // can render without re-creating a renderer function per render.
  const itemData = { vehicles, onOpen };

  function RowRenderer({ index, style, data }) {
    const v = data.vehicles[index];
    return <VehicleRow vehicle={v} style={style} onOpen={data.onOpen} />;
  }

  return (
    <div className="vlist" role="region" aria-label="Vehicles">
      <div className="vlist-head" aria-hidden="true">
        <span>Plate</span><span>Driver</span><span>Status</span><span>Coordinates</span>
      </div>
      <List
        height={height}
        itemCount={vehicles.length}
        itemSize={itemHeight}
        itemData={itemData}
        width="100%"
        overscanCount={6}
      >
        {RowRenderer}
      </List>
    </div>
  );
}

export default memo(VehicleList);