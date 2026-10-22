export default function OfflineBanner({ visible, pendingCount, syncStatus }) {
  if (!visible) return null;
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <span className="ob-dot" aria-hidden="true" />
      <span className="ob-text">
        Offline — live updates paused.
        {pendingCount > 0 && (
          <> {pendingCount} action{pendingCount === 1 ? '' : 's'} queued, will sync when the connection returns.</>
        )}
      </span>
      {syncStatus === 'syncing' && <span className="ob-tag">syncing…</span>}
    </div>
  );
}