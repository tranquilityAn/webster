import React from 'react';
import { TOOLS } from '../Editor.constants';

interface ToolbarProps {
  activeTool: string;
  onToolSelect: (toolId: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolSelect }) => {
  return (
    <aside className="editor-toolbar">
      {TOOLS.map(({ id: toolId, label, Icon }, idx) => (
        <React.Fragment key={toolId}>
          {idx === 2 && <div className="toolbar-separator" />}
          <button
            className={`toolbar-btn${activeTool === toolId ? ' active' : ''}`}
            title={label}
            onClick={() => onToolSelect(toolId)}
          >
            <Icon />
          </button>
        </React.Fragment>
      ))}
    </aside>
  );
};
