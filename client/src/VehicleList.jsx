import { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import VehicleRow from './VehicleRow.jsx';

const ROW_HEIGHT = 56;

function VehicleList({ vehicles, height = 600, itemHeight = ROW_HEIGHT }) {
  // Stable renderer passed to react-window. Only the currently visible rows
  // are ever rendered by react-window — this is the whole point of the task.
  const Row = useCallback(
    ({ index, style, data }) => (
      <VehicleRow vehicle={data[index]} style={style} />
    ),
    [],
  );

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
        {Row}
      </List>
    </div>
  );
}

// Memo prevents the whole list from re-rendering when App state (e.g. the
// `live` boolean) changes for reasons unrelated to the data.
export default memo(VehicleList);