"use client";
import { CSSProperties } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  id?: string;
  helpText?: string;
}

const TOOLBAR_BUTTONS: { label: string; style?: CSSProperties }[] = [
  { label: "B", style: { fontWeight: 700 } },
  { label: "I", style: { fontStyle: "italic" } },
  { label: "H1" },
  { label: "H2" },
  { label: "≡" },
  { label: '"' },
  { label: "🔗" },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Escribe el contenido. Puedes usar Markdown: **negrita**, *cursiva*, # títulos, > citas, etc.",
  minHeight = 240,
  id,
  helpText = "Soporta Markdown: **negrita**, *cursiva*, `código`, ## h2, - lista",
}: MarkdownEditorProps) {
  return (
    <>
      <div style={{
        display: "flex",
        gap: 4,
        padding: 8,
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderBottom: 0,
        borderRadius: "10px 10px 0 0",
        flexWrap: "wrap",
      }}>
        {TOOLBAR_BUTTONS.map((btn) => (
          <button
            key={btn.label}
            type="button"
            className="sel"
            style={{ padding: "5px 10px", fontSize: 12, ...(btn.style ?? {}) }}
            tabIndex={-1}
            aria-label={`Formato ${btn.label} (decorativo)`}
          >
            {btn.label}
          </button>
        ))}
        <div style={{
          marginLeft: "auto",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--ink-3)",
          padding: "5px 10px",
          letterSpacing: ".1em",
          alignSelf: "center",
        }}>
          MARKDOWN
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          minHeight,
          borderRadius: "0 0 10px 10px",
          borderTop: 0,
          width: "100%",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      />
      {helpText && <div className="help" style={{ marginTop: 6 }}>{helpText}</div>}
    </>
  );
}
