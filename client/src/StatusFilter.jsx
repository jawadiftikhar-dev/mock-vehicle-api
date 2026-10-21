import { STATUSES } from './vehicleFilter.js';

const LABELS = {
  all: 'All statuses',
  active: 'Active',
  idle: 'Idle',
  offline: 'Offline',
  maintenance: 'Maintenance',
};

export default function StatusFilter({ value, onChange }) {
  return (
    <label className="control">
      <span className="control-label">Status</span>
      <select
        className="select"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Filter vehicles by status"
      >
        {STATUSES.map(s => (
          <option key={s} value={s}>{LABELS[s]}</option>
        ))}
      </select>
    </label>
  );
}