import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Trash2, ChevronsLeft } from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  isExpanded?: boolean;
  children?: Folder[];
}

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolder: string | null;
  width: number;
  isCollapsed: boolean;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: (parentId?: string) => void;
  onFolderDelete: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderToggle: (folderId: string) => void;
  onWidthChange: (width: number) => void;
  onCollapse: () => void;
  onNoteDrop: (noteId: string, folderId: string | null) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  selectedFolder,
  width,
  isCollapsed,
  onFolderSelect,
  onFolderCreate,
  onFolderDelete,
  onFolderRename,
  onFolderToggle,
  onWidthChange,
  onCollapse,
  onNoteDrop,
}) => {
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleFolderEdit = (folderId: string, currentName: string) => {
    setEditingFolder(folderId);
    setEditingName(currentName);
  };

  const handleFolderSave = (folderId: string) => {
    if (editingName.trim()) {
      onFolderRename(folderId, editingName.trim());
    }
    setEditingFolder(null);
    setEditingName('');
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      onNoteDrop(noteId, folderId);
    }
    setDragOverFolder(null);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const renderFolder = (folder: Folder, level: number = 0) => (
    <div key={folder.id} className="select-none">
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 group ${
          selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
        } ${dragOverFolder === folder.id ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        whileHover={{ x: 2 }}
        onClick={() => onFolderSelect(folder.id)}
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, folder.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFolderToggle(folder.id);
          }}
          className="w-4 h-4 flex items-center justify-center"
        >
          {folder.children && folder.children.length > 0 ? (
            folder.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
          ) : null}
        </button>
        
        {folder.isExpanded ? (
          <FolderOpen className="w-4 h-4 text-blue-500" />
        ) : (
          <Folder className="w-4 h-4 text-gray-500" />
        )}
        
        {editingFolder === folder.id ? (
          <input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={() => handleFolderSave(folder.id)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleFolderSave(folder.id);
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm font-medium">{folder.name}</span>
        )}
        
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFolderCreate(folder.id);
            }}
            className="p-1 rounded hover:bg-gray-200"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFolderEdit(folder.id, folder.name);
            }}
            className="p-1 rounded hover:bg-gray-200"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFolderDelete(folder.id);
            }}
            className="p-1 rounded hover:bg-red-200 text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {folder.isExpanded && folder.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {folder.children.map(child => renderFolder(child, level + 1))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 h-full flex flex-col items-center py-4">
        <button
          onClick={onCollapse}
          className="p-2 rounded hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white border-r border-gray-200 h-full flex"
      style={{ width }}
    >
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Folders</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onFolderCreate()}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onCollapse}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => onFolderSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-100 ${
              selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
            } ${dragOverFolder === null ? 'border-2 border-blue-300 border-dashed bg-blue-50' : ''}`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">All Notes</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          {folders.map(folder => renderFolder(folder))}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`w-1 cursor-col-resize hover:bg-blue-300 transition-colors ${isResizing ? 'bg-blue-400' : 'bg-transparent'}`}
      />
    </div>
  );
};

export default FolderSidebar;
