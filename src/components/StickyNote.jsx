
import React, { useState } from 'react';
import { X, GripVertical, CornerDownRight } from 'lucide-react';
import '../styles/StickyNote.css';

const StickyNote = ({
  id,
  content,
  color,
  position,
  size,
  onUpdate,
  onDelete,
  onMove,
  onResize,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(id, text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(150, startWidth + (e.clientX - startX));
      const newHeight = Math.max(150, startHeight + (e.clientY - startY));
      onResize(id, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDragStart = () => setIsDragging(true);
  
  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    onMove(id, {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    });
  };

  const noteStyle = {
    transform: `translate(${position.x}px, ${position.y}px) ${isDragging ? 'scale(1.05)' : 'scale(1)'} rotate(${isDragging ? 0 : Math.random() * 6 - 3}deg)`,
    width: size.width,
    height: size.height,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      className={`sticky-note ${color} ${isDragging ? 'dragging' : ''}`}
      style={noteStyle}
      onMouseDown={!isResizing ? handleDragStart : undefined}
    >
      <div className="sticky-note-header">
        <GripVertical className="grip-icon" />
        <button
          onClick={() => onDelete(id)}
          className="delete-note-button"
        >
          <X className="delete-note-icon" />
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          autoFocus
          className="note-textarea"
          style={{ height: size.height - 80 }}
          placeholder="Type your note... (Ctrl+Enter to finish)"
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className="note-content"
          style={{ height: size.height - 80 }}
        >
          {text || "Double-click to edit..."}
        </div>
      )}

      <div
        onMouseDown={handleResizeStart}
        className="resize-handle"
      >
        <CornerDownRight className="resize-icon" />
      </div>
    </div>
  );
};

export default StickyNote;
