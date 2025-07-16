import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import StickyNote from './StickyNote';
import ColorPicker from './ColorPicker';
import FolderSidebar from './FolderSidebar';
import '../styles/StickyNotesBoard.css';

const StickyNotesBoard = () => {
  const [notes, setNotes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('bg-yellow-200');
  
  // New structure: folders contain boards, boards contain notes
  const [folders, setFolders] = useState([
    { 
      id: 'all-boards', 
      name: 'All Boards', 
      type: 'folder',
      isExpanded: true, 
      children: [
        { id: 'quick-notes', name: 'Quick Notes', type: 'board', children: [] }
      ] 
    },
  ]);
  
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedBoard, setSelectedBoard] = useState('quick-notes');
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [draggedNote, setDraggedNote] = useState(null);

  const getNoteCountForBoard = (boardId) => {
    return notes.filter(note => note.boardId === boardId).length;
  };

  const getAllNoteCounts = () => {
    const counts = {};
    const countRecursively = (items) => {
      items.forEach(item => {
        if (item.type === 'board') {
          counts[item.id] = getNoteCountForBoard(item.id);
        }
        if (item.children) {
          countRecursively(item.children);
        }
      });
    };
    countRecursively(folders);
    return counts;
  };

  const noteCounts = getAllNoteCounts();

  const createNote = () => {
    if (!selectedBoard) return;
    
    const currentSidebarWidth = sidebarCollapsed ? 48 : sidebarWidth;
    const newNote = {
      id: Date.now().toString(),
      content: '',
      color: selectedColor,
      position: {
        x: Math.max(currentSidebarWidth + 20, Math.random() * (window.innerWidth - 400 - currentSidebarWidth) + currentSidebarWidth),
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      size: { width: 192, height: 192 },
      boardId: selectedBoard,
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id, content) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const moveNote = (id, pos) => {
    const margin = sidebarCollapsed ? 48 : sidebarWidth;
    setNotes(prev => prev.map(n =>
      n.id === id
        ? { ...n, position: { x: Math.max(pos.x, margin), y: Math.max(pos.y, 0) } }
        : n)
    );
  };

  const resizeNote = (id, size) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, size } : note
    ));
  };

  const handleNoteDrop = (noteId, targetId) => {
    // Find if target is a board or folder
    const findItemById = (items, id) => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItemById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const targetItem = findItemById(folders, targetId);
    
    // Only allow dropping on boards, not folders
    if (!targetItem || targetItem.type !== 'board') {
      setDraggedNote(null);
      return;
    }

    setNotes(notes.map(note => 
      note.id === noteId ? 
      { ...note, boardId: targetId } : note
    ));
    setDraggedNote(null);
  };

  const handleBoardMove = (boardId, targetFolderId) => {
    // Remove board from its current location
    const removeBoardRecursively = (folderList) => {
      return folderList.map(folder => ({
        ...folder,
        children: folder.children ? removeBoardRecursively(folder.children).filter(child => child.id !== boardId) : undefined
      }));
    };

    // Find the board being moved
    const findBoardById = (items, id) => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findBoardById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const boardToMove = findBoardById(folders, boardId);
    if (!boardToMove) return;
    // Add board to target folder
    const addBoardToFolder = (folderList) => {
      return folderList.map(folder => {
        if (folder.id === targetFolderId) {
          return {
            ...folder,
            children: [...(folder.children || []), boardToMove],
            isExpanded: true
          };
        } else if (folder.children) {
          return {
            ...folder,
            children: addBoardToFolder(folder.children)
          };
        }
        return folder;
      });
    };

    const foldersWithoutBoard = removeBoardRecursively(folders);
    const foldersWithMovedBoard = addBoardToFolder(foldersWithoutBoard);
    setFolders(foldersWithMovedBoard);
  };

  const createFolder = (parentId) => {
    const newFolder = {
      id: Date.now().toString(),
      name: 'New Folder',
      type: 'folder',
      isExpanded: true,
      children: [],
    };

    if (parentId) {
      const updateFoldersRecursively = (folderList) => {
        return folderList.map(folder => {
          if (folder.id === parentId) {
            return {
              ...folder,
              children: [...(folder.children || []), newFolder],
            };
          } else if (folder.children) {
            return {
              ...folder,
              children: updateFoldersRecursively(folder.children),
            };
          }
          return folder;
        });
      };
      setFolders(updateFoldersRecursively(folders));
    } else {
      setFolders([...folders, newFolder]);
    }
  };

  const createBoard = (parentId) => {
    const newBoard = {
      id: Date.now().toString(),
      name: 'New Board',
      type: 'board',
      children: [],
    };

    const updateFoldersRecursively = (folderList) => {
      return folderList.map(folder => {
        if (folder.id === parentId) {
          return {
            ...folder,
            children: [...(folder.children || []), newBoard],
            isExpanded: true, // Expand folder when adding board
          };
        } else if (folder.children) {
          return {
            ...folder,
            children: updateFoldersRecursively(folder.children),
          };
        }
        return folder;
      });
    };

    if (parentId) {
      setFolders(updateFoldersRecursively(folders));
    } else {
      // Add to All Boards folder by default
      setFolders(updateFoldersRecursively(folders));
    }
    
    // Auto-select the new board
    setSelectedBoard(newBoard.id);
    setSelectedFolder(null);
  };

  const deleteItem = (itemId) => {
    const deleteItemRecursively = (folderList) => {
      return folderList
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          children: item.children ? deleteItemRecursively(item.children) : undefined,
        }));
    };
    
    setFolders(deleteItemRecursively(folders));
    
    // Remove notes from deleted boards
    setNotes(notes.filter(note => note.boardId !== itemId));
    
    // Reset selection if deleted item was selected
    if (selectedBoard === itemId) {
      setSelectedBoard('quick-notes');
      setSelectedFolder(null);
    }
    if (selectedFolder === itemId) {
      setSelectedFolder(null);
      setSelectedBoard('quick-notes');
    }
  };

  const renameItem = (itemId, newName) => {
    const renameItemRecursively = (folderList) => {
      return folderList.map(item => {
        if (item.id === itemId) {
          return { ...item, name: newName };
        } else if (item.children) {
          return {
            ...item,
            children: renameItemRecursively(item.children),
          };
        }
        return item;
      });
    };
    setFolders(renameItemRecursively(folders));
  };

  const toggleFolder = (folderId) => {
    const toggleFolderRecursively = (folderList) => {
      return folderList.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, isExpanded: !folder.isExpanded };
        } else if (folder.children) {
          return {
            ...folder,
            children: toggleFolderRecursively(folder.children),
          };
        }
        return folder;
      });
    };
    setFolders(toggleFolderRecursively(folders));
  };

  const handleItemSelect = (itemId) => {
    const findItemById = (items, id) => {
      for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
          const found = findItemById(item.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedItem = findItemById(folders, itemId);
    
    if (selectedItem?.type === 'board') {
      setSelectedBoard(itemId);
      setSelectedFolder(null);
    } else if (selectedItem?.type === 'folder') {
      setSelectedFolder(itemId);
      setSelectedBoard(null);
      
      // If folder has boards, auto-select the first one
      if (selectedItem.children && selectedItem.children.length > 0) {
        const firstBoard = selectedItem.children.find(child => child.type === 'board');
        if (firstBoard) {
          setSelectedBoard(firstBoard.id);
          setSelectedFolder(null);
        }
      }
    }
  };

  const filteredNotes = selectedBoard 
    ? notes.filter(note => note.boardId === selectedBoard)
    : [];

  const currentSidebarWidth = sidebarCollapsed ? 48 : sidebarWidth;

  const getSelectedItemName = () => {
    if (selectedBoard) {
      const findItemById = (items, id) => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = findItemById(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const board = findItemById(folders, selectedBoard);
      return board?.name || 'Board';
    }
    return 'Folder';
  };

  const isEmptyFolder = selectedFolder && !selectedBoard;

  return (
    <div className="sticky-notes-board">
      <div className="sidebar-container" style={{ width: currentSidebarWidth }}>
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          selectedBoard={selectedBoard}
          width={sidebarWidth}
          isCollapsed={sidebarCollapsed}
          onItemSelect={handleItemSelect}
          onFolderCreate={createFolder}
          onBoardCreate={createBoard}
          onItemDelete={deleteItem}
          onItemRename={renameItem}
          onFolderToggle={toggleFolder}
          onWidthChange={setSidebarWidth}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNoteDrop={handleNoteDrop}
          onBoardMove={handleBoardMove}
          draggedNoteId={draggedNote?.id}
          notes={notes}
        />
      </div>

      <div 
        className="main-content"
        style={{ marginLeft: currentSidebarWidth }}
      >
        <div 
          className="header" 
          style={{ left: currentSidebarWidth }}
        >
          <div className="header-content">
            <h1 className="app-title">
              ✨ Sticky Spark - {getSelectedItemName()}
            </h1>
            
            {!isEmptyFolder && (
              <div className="header-controls">
                <ColorPicker 
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                />
                
                <button
                  onClick={createNote}
                  className="new-note-button"
                >
                  <Plus className="new-note-icon" />
                  New Note
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="board">
          {isEmptyFolder ? (
            <div className="empty-state">
              <div className="empty-emoji">📂</div>
              <h2 className="empty-title">Nothing here yet!</h2>
              <p className="empty-description">
                Create a board to get started organizing your notes.
              </p>
              <button
                onClick={() => createBoard(selectedFolder)}
                className="create-first-note-button"
              >
                <Plus className="create-first-note-icon" />
                Create Your First Board
              </button>
            </div>
          ) : filteredNotes.length === 0 && selectedBoard ? (
            <div className="empty-state">
              <div className="empty-emoji">📝</div>
              <h2 className="empty-title">Ready to capture your ideas?</h2>
              <p className="empty-description">
                Create your first sticky note and start brainstorming. Perfect for travel plans, restaurant lists, or your next big idea!
              </p>
              <button
                onClick={createNote}
                className="create-first-note-button"
              >
                <Plus className="create-first-note-icon" />
                Create Your First Note
              </button>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <StickyNote
                key={note.id}
                {...note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onMove={moveNote}
                onResize={resizeNote}
                onStartDrag={() => setDraggedNote(note)}
                onEndDrag={() => setDraggedNote(null)}
              />
            ))
          )}
        </div>

        <div className="grid-pattern" />
      </div>
    </div>
  );
};

export default StickyNotesBoard;
