
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical, CornerDownRight } from 'lucide-react';

interface StickyNoteProps {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
  onResize: (id: string, size: { width: number; height: number }) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
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

  return (
    <motion.div
      drag={!isResizing}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onMove(id, {
          x: position.x + info.offset.x,
          y: position.y + info.offset.y,
        });
      }}
      initial={{ scale: 0, rotate: -5 }}
      animate={{ 
        scale: 1, 
        rotate: isDragging ? 0 : Math.random() * 6 - 3,
        x: position.x,
        y: position.y,
      }}
      whileHover={{ scale: 1.02, rotate: 0 }}
      whileDrag={{ scale: 1.05, rotate: 0, zIndex: 1000 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
      className={`absolute p-4 rounded-lg shadow-lg cursor-move select-none ${color} border border-black/10`}
      style={{ 
        x: position.x, 
        y: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <GripVertical className="w-4 h-4 text-gray-500 opacity-50" />
        <button
          onClick={() => onDelete(id)}
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          autoFocus
          className="w-full resize-none outline-none text-gray-800 text-sm leading-relaxed font-medium bg-transparent"
          style={{ height: size.height - 80 }}
          placeholder="Type your note... (Ctrl+Enter to finish)"
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className="w-full text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words overflow-auto"
          style={{ height: size.height - 80 }}
        >
          {text || "Double-click to edit..."}
        </div>
      )}

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity"
      >
        <CornerDownRight className="w-4 h-4 text-gray-500" />
      </div>
    </motion.div>
  );
};

export default StickyNote;
