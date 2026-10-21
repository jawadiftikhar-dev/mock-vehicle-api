export default function SortControl({ value, onChange }) {
  const next = value === 'asc' ? 'desc' : 'asc';
  return (
    <label className="control">
      <span className="control-label">Sort by driver</span>
      <button
        type="button"
        className="sort-btn"
        onClick={() => onChange(next)}
        aria-label={`Sort by driver name, currently ${value}ending, click to toggle`}
      >
        <span aria-hidden="true" className="sort-icon">
          {value === 'asc' ? '↑' : '↓'}
        </span>
        {value === 'asc' ? 'A → Z' : 'Z → A'}
      </button>
    </label>
  );
}