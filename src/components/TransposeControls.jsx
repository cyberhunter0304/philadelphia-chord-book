import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { transposeChordToken } from "@/lib/chords";

function Stepper({ label, display, onDec, onInc, decDisabled, incDisabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center rounded-lg border bg-background">
        <button
          type="button"
          onClick={onDec}
          disabled={decDisabled}
          className="grid h-8 w-8 place-items-center rounded-l-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[3.25rem] border-x px-2 text-center text-sm font-medium tabular-nums">
          {display}
        </span>
        <button
          type="button"
          onClick={onInc}
          disabled={incDisabled}
          className="grid h-8 w-8 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-30"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function TransposeControls({ songKey, transpose, zoom, onChange, showZoom = true }) {
  const set = (patch) => onChange({ transpose, zoom, ...patch });
  const root = songKey ? songKey.split(/[\s/-]/)[0] : null;
  const sounding = root ? transposeChordToken(root, transpose) : null;
  const dirty = transpose !== 0 || Math.abs(zoom - 1) > 0.001;

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-3 rounded-xl border bg-surface px-4 py-3">
      {root && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Key
          </span>
          <div className="flex h-8 items-center gap-1.5 text-sm font-semibold">
            <span className={cn(transpose !== 0 && "text-muted-foreground line-through")}>{root}</span>
            {transpose !== 0 && <span className="text-chord">{sounding}</span>}
          </div>
        </div>
      )}

      <Stepper
        label="Transpose"
        display={transpose > 0 ? `+${transpose}` : transpose}
        onDec={() => set({ transpose: transpose - 1 })}
        onInc={() => set({ transpose: transpose + 1 })}
        decDisabled={transpose <= -11}
        incDisabled={transpose >= 11}
      />

      {showZoom && (
        <Stepper
          label="Size"
          display={`${Math.round(zoom * 100)}%`}
          onDec={() => set({ zoom: Math.max(0.6, +(zoom - 0.1).toFixed(2)) })}
          onInc={() => set({ zoom: Math.min(2.5, +(zoom + 0.1).toFixed(2)) })}
          decDisabled={zoom <= 0.6}
          incDisabled={zoom >= 2.5}
        />
      )}

      <button
        type="button"
        onClick={() => set({ transpose: 0, zoom: 1 })}
        disabled={!dirty}
        className="ml-auto flex h-8 items-center gap-1.5 self-end rounded-lg px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </button>
    </div>
  );
}
