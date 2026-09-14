export default function Stars({
  rating,
  count,
  size = "md",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const full = Math.round(rating * 2) / 2;
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center gap-1.5 ${textSize}`}>
      <div className="flex text-accent" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const diff = full - i;
          const glyph = diff >= 1 ? "★" : diff >= 0.5 ? "⯨" : "☆";
          return <span key={i}>{glyph}</span>;
        })}
      </div>
      <span className="text-ink/60">
        {rating.toFixed(1)}
        {typeof count === "number" ? ` (${count.toLocaleString()})` : ""}
      </span>
    </div>
  );
}
