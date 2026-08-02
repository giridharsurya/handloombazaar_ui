"use client";

import React from "react";
import resolveImageUrl from "@/lib/resolveImage";

type ShopLogoUploadFieldProps = {
  inputId: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  selectedFile: File | null;
  currentImageUrl?: string | null;
  onFileChange: (file: File | null) => void;
};

export default function ShopLogoUploadField({
  inputId,
  label = "Shop Logo",
  required = false,
  disabled = false,
  selectedFile,
  currentImageUrl,
  onFileChange,
}: ShopLogoUploadFieldProps) {
  const [objectPreviewUrl, setObjectPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedFile) {
      setObjectPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setObjectPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const resolvedCurrent = resolveImageUrl(currentImageUrl);
  const previewSrc = objectPreviewUrl || resolvedCurrent;

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label} {required ? "*" : ""}
      </label>

      <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
        <input
          id={inputId}
          name={inputId}
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
          disabled={disabled}
          required={required}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:opacity-60"
        />
        <p className="mt-2 text-xs text-slate-500">PNG, JPG, or WEBP recommended.</p>
      </div>

      {selectedFile ? (
        <p className="text-xs text-slate-600">Selected: {selectedFile.name}</p>
      ) : null}

      {previewSrc ? (
        <div className="rounded-md border border-slate-300 bg-white p-3">
          <p className="mb-2 text-xs font-medium text-slate-600">Logo Preview</p>
          <img
            src={previewSrc}
            alt="Shop logo preview"
            className="h-28 w-28 rounded-md border border-slate-200 object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}
