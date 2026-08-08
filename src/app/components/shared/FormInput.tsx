import React from "react";

export function FormInput({ label, type = "text", value, onChange, placeholder, required }: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
        style={{
          background: "#F3F4F6",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
          color: "#111827",
        }}
      />
    </div>
  );
}

export function FormSelect({ label, value, onChange, options, required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all appearance-none"
        style={{
          background: "#F3F4F6",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
          color: "#111827",
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="mb-4">
      <label className="text-xs font-bold text-muted-foreground block mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all resize-none"
        style={{
          background: "#F3F4F6",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
          color: "#111827",
        }}
      />
    </div>
  );
}
