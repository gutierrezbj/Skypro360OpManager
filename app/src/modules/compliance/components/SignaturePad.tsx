"use client";

import { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

type Props = {
  label: string;
  name: string;
  value?: string;
  onChange: (dataUrl: string) => void;
};

export default function SignaturePad({ label, name, value, onChange }: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);

  const handleEnd = useCallback(() => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      onChange(sigRef.current.toDataURL("image/png"));
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    sigRef.current?.clear();
    onChange("");
  }, [onChange]);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium" style={{ color: "var(--sky-muted)" }}>{label}</label>
      <div className="rounded-md" style={{ border: "1px solid var(--sky-border-2)", background: "var(--sky-surface)" }}>
        <SignatureCanvas
          ref={sigRef}
          penColor="#1f2937"
          canvasProps={{
            className: "w-full h-28 rounded-t-md",
            style: { width: "100%", height: "112px", background: "#FFFFFF" },
          }}
          onEnd={handleEnd}
        />
        <div className="flex items-center justify-between px-2 py-1" style={{ borderTop: "1px solid var(--sky-border)" }}>
          <span className="text-[10px]" style={{ color: "var(--sky-muted)" }}>Firme arriba</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs hover:opacity-80" style={{ color: "var(--sky-accent-red)" }}
          >
            Limpiar
          </button>
        </div>
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}
