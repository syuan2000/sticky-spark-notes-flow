import React, { useState, useRef } from 'react';
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
  Search,
  Move,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
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
  onBoardMove,
  draggedNoteId,
  notes
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const draggedBoardRef = useRef(null);

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

  const handleDrop = (itemId, isFolder) => {
    if (draggedNoteId && !isFolder) {
        onNoteDrop(draggedNoteId, itemId);
      }
    else if (draggedBoardRef.current && isFolder) {
      onBoardMove(draggedBoardRef.current.id, itemId);
    }
    draggedBoardRef.current = null;
    setDragOverItem(null);
  };

  const handleDragEnter = (itemId, isFolder) => {
    if ((draggedNoteId && !isFolder) || (draggedBoardRef.current && isFolder) ) {
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

  const filterItems = (items) => {
    if (!searchTerm.trim()) return items;
  
    const lowerSearch = searchTerm.toLowerCase();
  
    return items.reduce((acc, item) => {
      const isFolder = item.type === 'folder';
      const isBoard = item.type === 'board';
      let match = false;
  
      if (item.name.toLowerCase().includes(lowerSearch)) {
        match = true;
      }
      if (isBoard && notes) {
        const relatedNotes = notes.filter(note => note.boardId === item.id);
        const noteMatch = relatedNotes.some(note =>
          note.content.toLowerCase().includes(lowerSearch)
        );
        if (noteMatch) {
          match = true;
        }
      }
  
      if (isFolder && item.children && item.children.length > 0) {
        const filteredChildren = filterItems(item.children);
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren, isExpanded: true });
          return acc;
        }
      }
      if (match) {
        acc.push(item);
      }
      return acc;
    }, []);
  };
  const getAllFolders = () => {
    const allFolders = [];
    const collectFolders = (items) => {
      items.forEach(item => {
        if (item.type === 'folder') {
          allFolders.push(item);
          if (item.children) {
            collectFolders(item.children);
          }
        }
      });
    };
    collectFolders(folders);
    return allFolders;
  };
  

  const renderItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isFolder = item.type === 'folder';
    const isBoard = item.type === 'board';
    const isSelected = (isFolder && selectedFolder === item.id) || (isBoard && selectedBoard === item.id);
    const isDragOver =
      dragOverItem === item.id &&
      (
        (draggedNoteId && isBoard)||      
        (draggedBoardRef.current && isFolder) 
      );
    return (
      <div key={item.id} className="folder-item">
        <div
          className={`folder-row ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => onItemSelect(item.id)}
          onMouseEnter={() => handleDragEnter(item.id, isFolder)}
          onMouseLeave={() => handleDragLeave(item.id)}
          onMouseUp={() => handleDrop(item.id, isFolder)}
          draggable={isBoard}
          onMouseDown={isBoard ? () => (draggedBoardRef.current = item) : undefined}
          onDragEnter={() => handleDragEnter(item.id, isFolder)} // For boards
          onDragOver={(e) => e.preventDefault()}             // Needed to allow drop
          onDrop={() => handleDrop(item.id, isFolder)}       // For boards

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
            item.isExpanded && hasChildren ? <FolderOpen className="folder-icon expanded" /> : <Folder className="folder-icon collapsed" />
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
            <div className="folder-name-container" onDoubleClick={() => handleDoubleClick(item.id, item.name)}>
              <span className="folder-name" draggable={false} >
                {item.name}
              </span>
              {isFolder && item.children?.length > 0 && (
                <span className="note-count-badge">
                  {item.children.length}
                </span>
              )}
            </div>
          )}

          <div className="folder-actions">
            {isFolder && (
              <button onClick={(e) => { e.stopPropagation(); onBoardCreate(item.id); }} className="folder-action-button" title="Add Board">
                <Plus className="folder-action-icon" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="folder-action-button" title="More options">
                  <MoreHorizontal className="folder-action-icon" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleItemEdit(item.id, item.name)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                
                {isBoard && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Move className="mr-2 h-4 w-4" />
                        Move to
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {getAllFolders().map(folder => (
                          <DropdownMenuItem
                            key={folder.id}
                            onClick={() => onBoardMove(item.id, folder.id)}
                          >
                            {folder.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
                
                {item.id !== 'all-boards' && item.id !== 'quick-notes' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onItemDelete(item.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
    <div className="folder-sidebar" style={{ width }}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="header-row">
            <h2 className="sidebar-title">Boards</h2>
            <div className="header-buttons">
              <button onClick={() => onBoardCreate('all-boards')} className="header-button" title="New Board">
                <Plus className="header-icon" />
              </button>
              <button onClick={onCollapse} className="header-button">
                <ChevronsLeft className="header-icon" />
              </button>
            </div>
          </div>
          <div className="search-bar">
          <Search size={16} className="search-icon" />
             <input
              type="text"
              placeholder="Search boards..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
          </div>
        </div>

        <div className="folders-container">
          {filterItems(folders).map(folder => renderItem(folder))}
        </div>
        
        <div className="sidebar-footer">
          <button 
            onClick={() => onFolderCreate()} 
            className="new-folder-button"
            title="New Folder"
          >
            <Plus className="new-folder-icon" />
            <span className="new-folder-text">New Folder</span>
          </button>
        </div>
      </div>

      <div onMouseDown={handleResizeStart} className={`resize-handle ${isResizing ? 'resizing' : ''}`} />
    </div>
  );
};

export default FolderSidebar;
