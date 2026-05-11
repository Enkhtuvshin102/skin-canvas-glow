import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SkinCard } from "@/components/skin/SkinCard";
import type { Skin } from "@/lib/skins-data";

export function SkinCarousel({ title, skins, accent }: { title: string; skins: Skin[]; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {accent && <span className="h-5 w-1 rounded-full" style={{ background: accent }} />}
          <h2 className="font-display text-xl font-bold tracking-wide">{title}</h2>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="rounded-lg glass p-1.5 hover:bg-white/5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll(1)} className="rounded-lg glass p-1.5 hover:bg-white/5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x">
        {skins.map((s) => (
          <div key={s.id} className="w-[240px] shrink-0 snap-start">
            <SkinCard skin={s} compact />
          </div>
        ))}
      </div>
    </section>
  );
}
