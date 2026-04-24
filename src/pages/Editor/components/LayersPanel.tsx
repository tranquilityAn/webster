import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { 
  IconEye, IconEyeOff, IconTrash, 
  IconLayer, IconPen, IconCircle, IconText, IconRect, IconImage, IconPolygon, IconStar,
  IconLine, IconArrow
} from './EditorIcons';

interface ElementData {
  id: string;
  name: string;
  type: string;
  visible: boolean;
}

interface LayersPanelProps {
  rootLayers: any[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleVisibility: (id: string, current: boolean) => void;
  onDragEnd: (result: DropResult) => void;
  
  // Renaming state
  editingId: string | null;
  editingValue: string;
  onRenameStart: (id: string, name: string) => void;
  onRenameChange: (val: string) => void;
  onRenameSave: () => void;
  onRenameCancel: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  rootLayers,
  selectedId,
  onSelect,
  onDelete,
  onToggleVisibility,
  onDragEnd,
  editingId,
  editingValue,
  onRenameStart,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
}) => {
  const allElements = useMemo(() => {
    const results: ElementData[] = [];
    rootLayers.forEach((layer: any) => {
      layer.children?.forEach((child: any) => {
        results.push({
          id: child.attrs?.id,
          name: child.attrs?.name || child.className,
          type: child.className,
          visible: child.attrs?.visible !== false,
        });
      });
    });
    return results.reverse();
  }, [rootLayers]);

  const getIconForType = (type: string, name: string) => {
    switch (type) {
      case 'Line': 
        return name.toLowerCase().includes('drawing') ? <IconPen /> : <IconLine />;
      case 'Arrow': return <IconArrow />;
      case 'Circle': return <IconCircle />;
      case 'Text': return <IconText />;
      case 'Rect': return <IconRect />;
      case 'Image': return <IconImage />;
      case 'RegularPolygon': return <IconPolygon />;
      case 'Star': return <IconStar />;
      default: return <IconLayer />;
    }
  };

  return (
    <div className="layers-list">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="layers">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {allElements.length > 0 ? (
                allElements.map((el, index) => (
                  <Draggable key={el.id} draggableId={el.id} index={index}>
                    {(providedInner, snapshot) => (
                      <div
                        ref={providedInner.innerRef}
                        {...providedInner.draggableProps}
                        {...providedInner.dragHandleProps}
                        className={`layer-item ${snapshot.isDragging ? 'is-dragging' : ''} ${selectedId === el.id ? 'active' : ''} ${!el.visible ? 'is-hidden' : ''}`}
                        onClick={() => onSelect(el.id)}
                        onDoubleClick={() => onRenameStart(el.id, el.name)}
                        style={{ 
                          ...providedInner.draggableProps.style,
                          paddingLeft: 16 
                        }}
                      >
                        <div className="layer-item-main">
                          <button 
                            className="layer-visibility-btn" 
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(el.id, el.visible); }}
                            title={el.visible ? 'Hide layer' : 'Show layer'}
                          >
                            {el.visible ? <IconEye /> : <IconEyeOff />}
                          </button>
                          {getIconForType(el.type, el.name)}
                          {editingId === el.id ? (
                            <input
                              className="layer-item-input"
                              value={editingValue}
                              onChange={(e) => onRenameChange(e.target.value)}
                              onBlur={onRenameSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onRenameSave();
                                if (e.key === 'Escape') onRenameCancel();
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="layer-item-name">{el.name}</span>
                          )}
                        </div>
                        <button 
                          className="layer-delete-btn" 
                          onClick={(e) => onDelete(el.id, e)}
                          title="Delete object"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="layers-empty-state">No elements in current view</div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};
