function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-image" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: "40%" }} />
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonProductDetail() {
  return (
    <div className="detail-layout" aria-hidden="true">
      <div className="skeleton skeleton-image" style={{ height: 440, borderRadius: 18 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="skeleton skeleton-text" style={{ width: "30%" }} />
        <div className="skeleton skeleton-title" style={{ width: "60%" }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" style={{ width: "50%" }} />
        <div className="skeleton" style={{ height: 44, width: "60%", borderRadius: 10, marginTop: "1rem" }} />
      </div>
    </div>
  );
}
