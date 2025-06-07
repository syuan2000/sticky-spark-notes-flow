
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Trash2 } from 'lucide-react';

export interface Folder {
  id: string;
  name: string;
  isExpanded?: boolean;
  children?: Folder[];
}

interface FolderSidebarProps {
  folders: Folder[];
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate: (parentId?: string) => void;
  onFolderDelete: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderToggle: (folderId: string) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onFolderCreate,
  onFolderDelete,
  onFolderRename,
  onFolderToggle,
}) => {
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const renderFolder = (folder: Folder, level: number = 0) => (
    <div key={folder.id} className="select-none">
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 group ${
          selectedFolder === folder.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        whileHover={{ x: 2 }}
        onClick={() => onFolderSelect(folder.id)}
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

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Folders</h2>
          <button
            onClick={() => onFolderCreate()}
            className="p-1 rounded hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-100 ${
            selectedFolder === null ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm font-medium">All Notes</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {folders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
};

export default FolderSidebar;
