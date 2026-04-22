import { useState, useCallback } from 'react';

interface UseLayerActionsProps {
  handleNodeChange: (id: string, attrs: any) => void;
  sendCommit: (commit: any) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export const useLayerActions = ({
  handleNodeChange,
  sendCommit,
  selectedId,
  setSelectedId,
}: UseLayerActionsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const handleDelete = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    sendCommit([{
      op: 'delete',
      id: id,
    }]);
    if (selectedId === id) setSelectedId(null);
  }, [sendCommit, selectedId, setSelectedId]);

  const handleToggleVisibility = useCallback((id: string, currentVisible: boolean) => {
    handleNodeChange(id, { visible: !currentVisible });
  }, [handleNodeChange]);

  const handleStartRename = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditingValue(currentName);
  }, []);

  const handleSaveRename = useCallback(() => {
    if (editingId) {
      handleNodeChange(editingId, { name: editingValue });
      setEditingId(null);
    }
  }, [editingId, editingValue, handleNodeChange]);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  return {
    handleDelete,
    handleToggleVisibility,
    handleStartRename,
    handleSaveRename,
    handleCancelRename,
    editingId,
    editingValue,
    setEditingValue,
  };
};
