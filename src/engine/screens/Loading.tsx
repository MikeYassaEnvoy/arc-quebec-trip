export function Loading({ what = 'the race' }: { what?: string }) {
  return (
    <div className="screen loading">
      <div className="loading__flag">🏁</div>
      <p className="lead">Loading {what}…</p>
    </div>
  );
}
