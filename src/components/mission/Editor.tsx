"use client";

import MonacoEditor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("architect", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6f7d96", fontStyle: "italic" },
      { token: "keyword", foreground: "a78bfa" },
      { token: "string", foreground: "6ee7b7" },
      { token: "number", foreground: "fbbf24" },
      { token: "type", foreground: "67e8f9" },
      { token: "identifier", foreground: "e6edf7" },
      { token: "delimiter", foreground: "a9b6cc" },
    ],
    colors: {
      "editor.background": "#04060c",
      "editor.foreground": "#e6edf7",
      "editorLineNumber.foreground": "#4a5670",
      "editorLineNumber.activeForeground": "#a9b6cc",
      "editor.lineHighlightBackground": "#0c122055",
      "editor.selectionBackground": "#22d3ee33",
      "editorCursor.foreground": "#22d3ee",
      "editorIndentGuide.background": "#1c2740",
      "editorIndentGuide.activeBackground": "#26344f",
      "editor.inactiveSelectionBackground": "#22d3ee1a",
      "editorWidget.background": "#0c1220",
      "editorSuggestWidget.background": "#0c1220",
      "editorSuggestWidget.border": "#1c2740",
      "editorSuggestWidget.selectedBackground": "#17223a",
      "scrollbarSlider.background": "#26344f80",
      "editorGutter.background": "#04060c",
    },
  });
};

export function Editor({ value, onChange, onRun, errorLine, readOnly = false }: { value: string; onChange: (v: string) => void; onRun: () => void; errorLine?: number | null; readOnly?: boolean }) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const decorations = useRef<ReturnType<Parameters<OnMount>[0]["createDecorationsCollection"]> | null>(null);
  const runRef = useRef(onRun);
  useEffect(() => {
    runRef.current = onRun;
  }, [onRun]);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
    decorations.current = editor.createDecorationsCollection([]);
    editor.focus();
  };

  // Highlight the error line
  useEffect(() => {
    const monaco = monacoRef.current;
    const dec = decorations.current;
    if (!monaco || !dec) return;
    dec.set(
      errorLine
        ? [{ range: new monaco.Range(errorLine, 1, errorLine, 1), options: { isWholeLine: true, className: "bg-rose/10", linesDecorationsClassName: "border-l-2 border-rose" } }]
        : [],
    );
  }, [errorLine]);

  return (
    <div className="monaco-host h-full min-h-[320px] overflow-hidden rounded-[10px] border border-line">
      <MonacoEditor
        height="100%"
        defaultLanguage="python"
        language="python"
        theme="architect"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        beforeMount={defineTheme}
        onMount={onMount}
        loading={<div className="flex h-full items-center justify-center font-mono text-[12px] text-fg-3">Loading editor…</div>}
        options={{
          readOnly,
          fontFamily: "var(--font-jet), JetBrains Mono, monospace",
          fontSize: 13.5,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          renderLineHighlight: "line",
          tabSize: 4,
          insertSpaces: true,
          detectIndentation: false,
          wordWrap: "on",
          padding: { top: 14, bottom: 14 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          bracketPairColorization: { enabled: true },
          quickSuggestions: { other: true, comments: false, strings: false },
          suggestOnTriggerCharacters: true,
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 10,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        }}
      />
    </div>
  );
}
