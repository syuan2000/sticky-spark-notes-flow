
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, GripVertical } from 'lucide-react';

interface StickyNoteProps {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: { x: number; y: number }) => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  content,
  color,
  position,
  onUpdate,
  onDelete,
  onMove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(content);
  const [isDragging, setIsDragging] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdate(id, text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Only finish editing on Ctrl+Enter or Cmd+Enter, not just Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleBlur();
    }
    // Let normal Enter create new lines
  };

  return (
    <motion.div
      drag
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
      className={`absolute w-48 h-48 p-4 rounded-lg shadow-lg cursor-move select-none ${color} border border-black/10`}
      style={{ x: position.x, y: position.y }}
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
          className="w-full h-32 bg-transparent resize-none outline-none text-gray-800 text-sm leading-relaxed font-medium"
          placeholder="Type your note... (Ctrl+Enter to finish)"
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          className="w-full h-32 text-gray-800 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words"
        >
          {text || "Double-click to edit..."}
        </div>
      )}
    </motion.div>
  );
};

export default StickyNote;
