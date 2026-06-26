export default function Brand({ tagline = true }: { tagline?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark">AVS</span>
      {tagline && <span className="brand-tagline">Asset Valuation Specialists</span>}
    </div>
  );
}
