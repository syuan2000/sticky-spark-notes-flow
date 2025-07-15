
import React, { useState } from 'react';
import { X, GripVertical, FolderInput } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
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
  onEndDrag,
  onMoveToBoard,
  availableBoards = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHtml5Dragging, setIsHtml5Dragging] = useState(false);

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
    if (isResizing || isEditing || isHtml5Dragging) return;
    e.preventDefault();
    
    // Small delay to allow HTML5 drag to take precedence
    setTimeout(() => {
      if (!isHtml5Dragging) {
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
      }
    }, 50);
  };

  // HTML5 drag-and-drop handlers for dropping notes to different boards
  const handleDragStart = (e) => {
    if (isResizing || isEditing) return;
    
    setIsHtml5Dragging(true);
    
    // Set the note ID in dataTransfer for the sidebar to receive
    e.dataTransfer.setData('application/note-id', id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.currentTarget.offsetWidth / 2, e.currentTarget.offsetHeight / 2);
    
    // Remove the temporary drag image after a short delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    
    // Call the parent's drag start handler
    onStartDrag?.();
    
    // Add visual feedback
    e.currentTarget.style.opacity = '0.7';
    e.currentTarget.style.transform = `translate(${position.x}px, ${position.y}px) scale(0.95)`;
  };

  const handleDragEnd = (e) => {
    setIsHtml5Dragging(false);
    
    // Reset visual feedback
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = `translate(${position.x}px, ${position.y}px) scale(1)`;
    
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
    zIndex: isDragging || isHtml5Dragging ? 1000 : 1,
    backgroundColor: getBackgroundColor(),
  };

  return (
    <div
      className={`sticky-note ${getBackgroundColor() ? '' : color} ${isDragging ? 'dragging' : ''} ${isHtml5Dragging ? 'html5-dragging' : ''}`}
      style={noteStyle}
      draggable={!isResizing && !isEditing}
      onMouseDown={!isResizing ? handleMouseDown : undefined}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="sticky-note-header">
        <GripVertical className="grip-icon" />
        <div className="note-actions">
          {availableBoards.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="move-note-button" title="Move to board">
                  <FolderInput className="move-note-icon" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Move to board</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableBoards.map(board => (
                  <DropdownMenuItem
                    key={board.id}
                    onClick={() => onMoveToBoard?.(id, board.id)}
                  >
                    {board.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            onClick={() => onDelete(id)}
            className="delete-note-button"
          >
            <X className="delete-note-icon" />
          </button>
        </div>
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
