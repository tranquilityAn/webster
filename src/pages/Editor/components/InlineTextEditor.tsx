import React, { useRef, useEffect } from 'react';

export interface InlineTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
  style: React.CSSProperties;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  onClose,
  style,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus immediately on mount
    textareaRef.current?.focus();
  }, []);

  return (
    <textarea
      ref={textareaRef}
      className="text-edit-overlay"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onClose}
      onKeyDown={(e) => {
        // Cmd/Ctrl+Enter or Escape to confirm
        if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
          e.preventDefault();
          onClose();
        }
      }}
      style={style}
      autoFocus
    />
  );
};
