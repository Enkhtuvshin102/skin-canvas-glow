import { wearLabel, type Wear } from "@/lib/skins-data";

interface Props {
  float: number;
  wear: Wear;
  showLabel?: boolean;
}

export function FloatBar({ float, wear, showLabel = true }: Props) {
  const pct = Math.min(1, Math.max(0, float)) * 100;
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono">{float.toFixed(6)}</span>
          <span>{wearLabel(wear)}</span>
        </div>
      )}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="absolute inset-0 float-bar opacity-90" />
        {/* wear range markers */}
        {[7, 15, 38, 45].map((m) => (
          <div key={m} className="absolute top-0 h-full w-px bg-black/40" style={{ left: `${m}%` }} />
        ))}
        {/* float marker */}
        <div
          className="absolute -top-1 h-3.5 w-1 rounded-sm bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
          style={{ left: `calc(${pct}% - 2px)` }}
        />
      </div>
    </div>
  );
}
