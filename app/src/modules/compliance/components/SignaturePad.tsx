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
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="rounded-md border border-gray-300 bg-white">
        <SignatureCanvas
          ref={sigRef}
          penColor="#1f2937"
          canvasProps={{
            className: "w-full h-28 rounded-t-md",
            style: { width: "100%", height: "112px" },
          }}
          onEnd={handleEnd}
        />
        <div className="flex items-center justify-between border-t border-gray-200 px-2 py-1">
          <span className="text-[10px] text-gray-400">Firme arriba</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Limpiar
          </button>
        </div>
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}
