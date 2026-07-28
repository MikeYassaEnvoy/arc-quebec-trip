import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Portrait warning — the whole game is designed for iPad landscape (§2). */
export function RotateScreen() {
  return (
    <div className="screen rotate">
      <div className="rotate__icon">🔄</div>
      <h1 className="h1 h1--mega">Turn the iPad sideways!</h1>
      <p className="lead">The Amazing Race is a widescreen sport.</p>
    </div>
  );
}

/** Friendly content-failure screen (§7A). */
export function ContentErrorScreen({
  title = 'The clue box is stuck!',
  detail,
  issues,
  onRetry,
}: {
  title?: string;
  detail?: string;
  issues?: string[];
  onRetry?: () => void;
}) {
  return (
    <div className="screen contenterror">
      <div className="card">
        <div className="contenterror__icon">🧩</div>
        <h1 className="h1">{title}</h1>
        <p className="lead">
          The race content did not load. A grown-up can reload the app — your progress is saved.
        </p>
        {detail && <p className="muted mono">{detail}</p>}
        {issues && issues.length > 0 && (
          <ul className="contenterror__issues mono">
            {issues.map((i, n) => (
              <li key={n}>{i}</li>
            ))}
          </ul>
        )}
        <button className="btn btn--yellow btn--mega" onClick={onRetry ?? (() => location.reload())}>
          Try again
        </button>
      </div>
    </div>
  );
}

interface BoundaryState {
  error: Error | null;
}

/** Nothing should ever crash to a white screen on the trip. */
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[race] crash', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <ContentErrorScreen
          title="Whoops — the race hit a pothole."
          detail={this.state.error.message}
          onRetry={() => {
            this.setState({ error: null });
            location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}
