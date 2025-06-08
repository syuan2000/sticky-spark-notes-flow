import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Trash2, ChevronsLeft } from 'lucide-react';
import '../styles/FolderSidebar.css';

const FolderSidebar = ({
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
  noteCounts,
}) => {
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverFolder, setDragOverFolder] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFolderEdit = (folderId, currentName) => {
    setEditingFolder(folderId);
    setEditingName(currentName);
  };

  const handleFolderSave = (folderId) => {
    if (editingName.trim()) {
      onFolderRename(folderId, editingName.trim());
    }
    setEditingFolder(null);
    setEditingName('');
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderId);
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverFolder(null);
      setIsDragActive(false);
    }
  };

  const handleDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    const noteId = e.dataTransfer.getData('text/plain');
    if (noteId) {
      onNoteDrop(noteId, folderId);
    }
    setDragOverFolder(null);
    setIsDragActive(false);
  };

  const handleDragEnd = () => {
    setDragOverFolder(null);
    setIsDragActive(false);
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e) => {
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

  const renderFolder = (folder, level = 0) => (
    <div key={folder.id} className="folder-item">
      <div
        className={`folder-row ${selectedFolder === folder.id ? 'selected' : ''} ${dragOverFolder === folder.id && isDragActive ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => onFolderSelect(folder.id)}
        onDragOver={(e) => handleDragOver(e, folder.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, folder.id)}
        onDragEnd={handleDragEnd}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFolderToggle(folder.id);
          }}
          className="folder-toggle"
        >
          {folder.children && folder.children.length > 0 ? (
            folder.isExpanded ? <ChevronDown className="folder-toggle-icon" /> : <ChevronRight className="folder-toggle-icon" />
          ) : null}
        </button>
        
        {folder.isExpanded ? (
          <FolderOpen className="folder-icon expanded" />
        ) : (
          <Folder className="folder-icon collapsed" />
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
            className="folder-name-input"
            autoFocus
          />
        ) : (
          <div className="folder-name-container">
            <span className="folder-name">
              {folder.name}
            </span>
            {noteCounts[folder.id] > 0 && (
              <span className="note-count-badge">
                {noteCounts[folder.id]}
              </span>
            )}
          </div>
        )}
        
        <div className="folder-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFolderCreate(folder.id);
            }}
            className="folder-action-button"
          >
            <Plus className="folder-action-icon" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFolderEdit(folder.id, folder.name);
            }}
            className="folder-action-button"
          >
            <MoreHorizontal className="folder-action-icon" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFolderDelete(folder.id);
            }}
            className="folder-action-button delete"
          >
            <Trash2 className="folder-action-icon" />
          </button>
        </div>
      </div>
      
      {folder.isExpanded && folder.children && (
        <div className="folder-children">
          {folder.children.map(child => renderFolder(child, level + 1))}
        </div>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <div className="sidebar-collapsed">
        <button
          onClick={onCollapse}
          className="collapse-button"
        >
          <ChevronRight className="collapse-icon" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="folder-sidebar"
      style={{ width }}
      onDragLeave={handleDragLeave}
      onDragEnd={handleDragEnd}
    >
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="header-row">
            <h2 className="sidebar-title">
              Folders
            </h2>
            <div className="header-buttons">
              <button
                onClick={() => onFolderCreate()}
                className="header-button"
              >
                <Plus className="header-icon" />
              </button>
              <button
                onClick={onCollapse}
                className="header-button"
              >
                <ChevronsLeft className="header-icon" />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => onFolderSelect(null)}
            className={`all-notes-button ${selectedFolder === null ? 'selected' : ''} ${dragOverFolder === null && isDragActive ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            onDragEnd={handleDragEnd}
          >
            <FolderOpen className="all-notes-icon" />
            <span className="all-notes-text">
              All Notes
            </span>
          </button>
        </div>
        
        <div className="folders-container">
          {folders.map(folder => renderFolder(folder))}
        </div>
      </div>

      <div
        onMouseDown={handleResizeStart}
        className={`resize-handle ${isResizing ? 'resizing' : ''}`}
      />
    </div>
  );
};

export default FolderSidebar;
