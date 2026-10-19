export default function StatusIcon({ status }) {
  switch (status) {
    case 'active':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <circle cx="8" cy="8" r="4" fill="currentColor" />
        </svg>
      );
    case 'idle':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <rect x="4" y="4" width="8" height="8" rx="2" fill="currentColor" />
        </svg>
      );
    case 'offline':
      return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'maintenance':
    default:
      return (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M8 2 2 13h12z" fill="currentColor" />
        </svg>
      );
  }
}