interface SkeletonPanelProps {
  variant: "two-pane" | "cards" | "workspace";
}

export function SkeletonPanel({ variant }: SkeletonPanelProps) {
  if (variant === "two-pane") {
    return (
      <div className="skeleton-panel skeleton-two-pane" role="status" aria-label="Loading">
        <div className="skeleton-block skeleton-list" />
        <div className="skeleton-block skeleton-main" />
      </div>
    );
  }
  if (variant === "workspace") {
    return (
      <div className="skeleton-panel skeleton-workspace" role="status" aria-label="Loading">
        <div className="skeleton-block skeleton-bar" />
        <div className="skeleton-block skeleton-main" />
      </div>
    );
  }
  return (
    <div className="skeleton-panel skeleton-cards" role="status" aria-label="Loading">
      <div className="skeleton-block" />
      <div className="skeleton-block" />
      <div className="skeleton-block" />
    </div>
  );
}
