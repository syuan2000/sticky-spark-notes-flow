
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  MoreHorizontal,
  Trash2,
  ChevronsLeft,
} from 'lucide-react';
import '../styles/FolderSidebar.css';

const FolderSidebar = ({
  folders,
  selectedFolder,
  selectedBoard,
  width,
  isCollapsed,
  onItemSelect,
  onFolderCreate,
  onBoardCreate,
  onItemDelete,
  onItemRename,
  onFolderToggle,
  onWidthChange,
  onCollapse,
  onNoteDrop,
  noteCounts,
  draggedNoteId,
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleItemEdit = (itemId, currentName) => {
    setEditingItem(itemId);
    setEditingName(currentName);
  };

  const handleItemSave = (itemId) => {
    if (editingName.trim()) {
      onItemRename(itemId, editingName.trim());
    }
    setEditingItem(null);
    setEditingName('');
  };

  const handleDoubleClick = (itemId, itemName) => {
    handleItemEdit(itemId, itemName);
  };

  const handleDrop = (itemId) => {
    if (draggedNoteId) {
      onNoteDrop(draggedNoteId, itemId);
    }
    setDragOverItem(null);
  };

  const handleDragEnter = (itemId) => {
    if (draggedNoteId) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = (itemId) => {
    if (dragOverItem === itemId) {
      setDragOverItem(null);
    }
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = width;
    const maxWidth = Math.floor(window.innerWidth / 3);

    const handleMouseMove = (e) => {
      const newWidth = Math.max(200, Math.min(maxWidth, startWidth + (e.clientX - startX)));
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

  const renderItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = item.type === 'folder';
    const isBoard = item.type === 'board';
    const isSelected = (isFolder && selectedFolder === item.id) || (isBoard && selectedBoard === item.id);
    const isDragOver = dragOverItem === item.id && draggedNoteId;
    
    return (
      <div key={item.id} className="folder-item">
        <div
          className={`folder-row ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => onItemSelect(item.id)}
          onMouseEnter={() => handleDragEnter(item.id)}
          onMouseLeave={() => handleDragLeave(item.id)}
          onMouseUp={() => handleDrop(item.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren && isFolder) {
                onFolderToggle(item.id);
              }
            }}
            className="folder-toggle"
            style={{ visibility: (hasChildren && isFolder) ? 'visible' : 'hidden' }}
          >
            {hasChildren && isFolder && (
              item.isExpanded ? <ChevronDown className="folder-toggle-icon" /> : <ChevronRight className="folder-toggle-icon" />
            )}
          </button>

          {isFolder ? (
            <>
              {item.isExpanded && hasChildren ? (
                <FolderOpen className="folder-icon expanded" />
              ) : (
                <Folder className="folder-icon collapsed" />
              )}
            </>
          ) : (
            <FileText className="folder-icon collapsed" />
          )}

          {editingItem === item.id ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => handleItemSave(item.id)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleItemSave(item.id);
                }
              }}
              className="folder-name-input"
              autoFocus
            />
          ) : (
            <div className="folder-name-container">
              <span 
                className="folder-name" 
                draggable={false}
                onDoubleClick={() => handleDoubleClick(item.id, item.name)}
              >
                {item.name}
              </span>
              {isBoard && noteCounts[item.id] > 0 && (
                <span className="note-count-badge">
                  {noteCounts[item.id]}
                </span>
              )}
            </div>
          )}

          <div className="folder-actions">
            {isFolder && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBoardCreate(item.id);
                }}
                className="folder-action-button"
                title="Add Board"
              >
                <Plus className="folder-action-icon" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleItemEdit(item.id, item.name);
              }}
              className="folder-action-button"
              title="Rename"
            >
              <MoreHorizontal className="folder-action-icon" />
            </button>
            {item.id !== 'all-boards' && item.id !== 'quick-notes' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onItemDelete(item.id);
                }}
                className="folder-action-button delete"
                title="Delete"
              >
                <Trash2 className="folder-action-icon" />
              </button>
            )}
          </div>
        </div>

        {item.isExpanded && hasChildren && (
          <div className="folder-children">
            {item.children.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="sidebar-collapsed">
        <button onClick={onCollapse} className="collapse-button">
          <ChevronRight className="collapse-icon" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="folder-sidebar"
      style={{ width }}
    >
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="header-row">
            <h2 className="sidebar-title">Boards</h2>
            <div className="header-buttons">
              <button
                onClick={() => onFolderCreate()}
                className="header-button"
                title="New Folder"
              >
                <Plus className="header-icon" />
              </button>
              <button onClick={onCollapse} className="header-button">
                <ChevronsLeft className="header-icon" />
              </button>
            </div>
          </div>
        </div>

        <div className="folders-container">
          {folders.map(folder => renderItem(folder))}
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
