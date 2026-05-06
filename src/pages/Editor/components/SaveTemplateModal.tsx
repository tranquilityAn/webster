import React, { useState } from 'react';

interface SaveTemplateModalProps {
  computedState: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  computedState,
  onClose,
  onSuccess,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [templatePublic, setTemplatePublic] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !computedState) return;
    setIsSavingTemplate(true);
    try {
      const response = await fetch('/webster/v1/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            type: 'template',
            attributes: {
              name: templateName,
              body: computedState,
              public: templatePublic,
            },
          },
        }),
      });
      if (response.ok) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to save template', err);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Save as Template</h2>
        <p className="modal-subtitle">Save the current canvas state as a template for future projects.</p>
        
        <div className="form-group" style={{ marginTop: 24 }}>
          <label>Template Name</label>
          <input
            type="text"
            className="modal-input"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="E.g., Instagram Post"
            autoFocus
          />
        </div>

        <div className="modal-actions" style={{ marginTop: 32 }}>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="submit-btn"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || isSavingTemplate}
          >
            {isSavingTemplate ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
};
