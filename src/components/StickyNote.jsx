
import React, { useState } from 'react';
import { X, GripVertical } from 'lucide-react';
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
  onStartDrag,
  onEndDrag
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const handleHorizontalResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = size.width;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(150, startWidth + (e.clientX - startX));
      onResize(id, { width: newWidth, height: size.height });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCornerResizeStart = (e) => {
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

  const handleMouseDown = (e) => {
    if (isResizing || isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    onStartDrag?.();
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });

    const handleMouseMove = (e) => {
      onMove(id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onEndDrag?.();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // HTML5 drag-and-drop handlers for dropping notes to different boards
  const handleDragStart = (e) => {
    if (isResizing || isEditing) return;
    
    // Set the note ID in dataTransfer for the sidebar to receive
    e.dataTransfer.setData('application/note-id', id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Call the parent's drag start handler
    onStartDrag?.();
    
    // Add visual feedback
    e.currentTarget.style.opacity = '0.7';
  };

  const handleDragEnd = (e) => {
    // Reset visual feedback
    e.currentTarget.style.opacity = '1';
    
    // Call the parent's drag end handler
    onEndDrag?.();
  };

  // Extract hex color from custom color classes like bg-[#hexcode]
  const getBackgroundColor = () => {
    if (color.startsWith('bg-[') && color.endsWith(']')) {
      return color.slice(4, -1); // Extract hex color from bg-[#hexcode]
    }
    return null;
  };

  const noteStyle = {
    transform: `translate(${position.x}px, ${position.y}px) ${isDragging ? 'scale(1.05)' : 'scale(1)'}`,
    width: size.width,
    height: size.height,
    zIndex: isDragging ? 1000 : 1,
    backgroundColor: getBackgroundColor(),
  };

  return (
    <div
      className={`sticky-note ${getBackgroundColor() ? '' : color} ${isDragging ? 'dragging' : ''}`}
      style={noteStyle}
      draggable={!isResizing && !isEditing}
      onMouseDown={!isResizing ? handleMouseDown : undefined}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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

      {/* Right edge for horizontal resize */}
      <div
        onMouseDown={handleHorizontalResizeStart}
        className="horizontal-resize-edge"
      />

      {/* Bottom-right corner for full resize */}
      <div
        onMouseDown={handleCornerResizeStart}
        className="corner-resize-area"
      />
    </div>
  );
};

export default StickyNote;
