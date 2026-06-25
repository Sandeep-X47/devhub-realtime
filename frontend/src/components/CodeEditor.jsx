import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

/**
 * Collaborative code editor.
 *
 * Sync model (deliberately simple for hackathon scale):
 *  - Local keystrokes broadcast `file:edit` to the room (throttled).
 *  - A `file:save` is debounced so we persist to Mongo without hammering it.
 *  - Remote `file:edit` events are applied imperatively with a suppress flag so
 *    applying them does NOT echo back out as a new local edit (no loops).
 *
 * Per-file models are keyed by `path={fileId}`, so each file keeps its own
 * undo history when you switch tabs — the same behaviour you'd expect in an IDE.
 */
export default function CodeEditor({ file, socket }) {
  const editorRef = useRef(null);
  const suppressRef = useRef(false);
  const throttleRef = useRef(0);
  const saveTimer = useRef(null);

  function handleMount(editor, monaco) {
    editorRef.current = editor;
    // A calm, deck-matching theme.
    monaco.editor.defineTheme('devhub', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0e1a',
        'editor.lineHighlightBackground': '#111726',
        'editorLineNumber.foreground': '#33405e',
        'editorGutter.background': '#0a0e1a',
        'editorIndentGuide.background1': '#1a2236',
      },
    });
    monaco.editor.setTheme('devhub');
  }

  function handleChange(value) {
    if (suppressRef.current) {
      suppressRef.current = false;
      return;
    }
    const s = socket.current;
    if (!s) return;

    // Throttle live broadcast to ~10/s.
    const now = Date.now();
    if (now - throttleRef.current > 100) {
      throttleRef.current = now;
      s.emit('file:edit', { fileId: file.id, content: value });
    }

    // Debounced durable save.
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      s.emit('file:save', { fileId: file.id, content: value, language: file.language });
    }, 700);
  }

  // Apply remote edits / restores to this file's model.
  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const onRemoteEdit = ({ fileId, content }) => {
      if (fileId !== file.id || !editorRef.current) return;
      if (editorRef.current.getValue() === content) return;
      suppressRef.current = true;
      // Preserve cursor position where possible.
      const pos = editorRef.current.getPosition();
      editorRef.current.setValue(content);
      if (pos) editorRef.current.setPosition(pos);
    };
    const onRestored = ({ fileId, content }) => onRemoteEdit({ fileId, content });

    s.on('file:edit', onRemoteEdit);
    s.on('file:restored', onRestored);
    return () => {
      s.off('file:edit', onRemoteEdit);
      s.off('file:restored', onRestored);
    };
  }, [file.id, socket]);

  return (
    <Editor
      key={file.id}
      path={file.id}
      defaultLanguage={file.language}
      defaultValue={file.content}
      onMount={handleMount}
      onChange={handleChange}
      options={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13.5,
        lineHeight: 21,
        minimap: { enabled: false },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        padding: { top: 14 },
        scrollBeyondLastLine: false,
        renderLineHighlight: 'all',
        automaticLayout: true,
        tabSize: 2,
      }}
      loading={<div className="h-full grid place-items-center text-muted text-sm">Loading editor…</div>}
    />
  );
}
