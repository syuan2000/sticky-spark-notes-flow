import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import StickyNote from './StickyNote';
import ColorPicker from './ColorPicker';
import FolderSidebar from './FolderSidebar';
import '../styles/StickyNotesBoard.css';

const StickyNotesBoard = () => {
  const [notes, setNotes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('bg-yellow-200');
  const [folders, setFolders] = useState([
    { id: 'travel', name: 'Travel Ideas', isExpanded: true, children: [] },
    { id: 'restaurants', name: 'Restaurants', isExpanded: false, children: [] },
    { id: 'work', name: 'Work Projects', isExpanded: false, children: [] },
  ]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // NEW: Track the currently dragged note and its original position
  const [draggedNote, setDraggedNote] = useState(null);
  const [draggedNoteOrigin, setDraggedNoteOrigin] = useState(null); // {id, position}

  const getNoteCountForFolder = (folderId) => {
    return notes.filter(note => note.folderId === folderId).length;
  };

  const getAllNoteCounts = () => {
    const counts = {};
    const countRecursively = (folders) => {
      folders.forEach(folder => {
        counts[folder.id] = getNoteCountForFolder(folder.id);
        if (folder.children) {
          countRecursively(folder.children);
        }
      });
    };
    countRecursively(folders);
    return counts;
  };

  const noteCounts = getAllNoteCounts();

  const createNote = () => {
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
      folderId: selectedFolder || undefined,
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

  // Move note during active dragging, do NOT apply sidebar constraint (just update)
  const moveNote = (id, pos) => {
    setNotes(prev => prev.map(n =>
      n.id === id
        ? { ...n, position: { x: pos.x, y: pos.y } }
        : n)
    );
  };

  // On drag start: capture the note and its original position.
  const handleStartDrag = (note) => {
    setDraggedNote(note);
    setDraggedNoteOrigin({ id: note.id, position: { ...note.position } });
  };

  // On drag end: if not dropped into folder, snap back to original position constrained to left margin
  const handleEndDrag = (droppedInSidebar = false) => {
    if (draggedNote && draggedNoteOrigin) {
      // Only snap back if drop did NOT result in a folder drop
      if (droppedInSidebar) {
        // Move back to original position, but ensure not overlapping sidebar
        const margin = sidebarCollapsed ? 48 : sidebarWidth;
        const original = draggedNoteOrigin.position;
        const newX = Math.max(original.x, margin);
        moveNote(draggedNote.id, { x: newX, y: original.y });
      }
    }
    setDraggedNote(null);
    setDraggedNoteOrigin(null);
  };

  // On successful drop into a folder: move the note into folder (don't change position)
  const handleNoteDrop = (noteId, folderId) => {
    setNotes(notes.map(note =>
      note.id === noteId ?
        { ...note, folderId: folderId || undefined }
        : note
    ));
    setDraggedNote(null);
    setDraggedNoteOrigin(null);
  };

  // --- FIX: Add resizeNote function! ---
  const resizeNote = (id, size) => {
    setNotes(notes => notes.map(
      note => note.id === id ? { ...note, size } : note
    ));
  };

  const createFolder = (parentId) => {
    const newFolder = {
      id: Date.now().toString(),
      name: 'New Folder',
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

  const deleteFolder = (folderId) => {
    const deleteFolderRecursively = (folderList) => {
      return folderList
        .filter(folder => folder.id !== folderId)
        .map(folder => ({
          ...folder,
          children: folder.children ? deleteFolderRecursively(folder.children) : undefined,
        }));
    };
    setFolders(deleteFolderRecursively(folders));
    
    setNotes(notes.map(note => 
      note.folderId === folderId ? { ...note, folderId: undefined } : note
    ));
    
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
  };

  const renameFolder = (folderId, newName) => {
    const renameFolderRecursively = (folderList) => {
      return folderList.map(folder => {
        if (folder.id === folderId) {
          return { ...folder, name: newName };
        } else if (folder.children) {
          return {
            ...folder,
            children: renameFolderRecursively(folder.children),
          };
        }
        return folder;
      });
    };
    setFolders(renameFolderRecursively(folders));
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

  const filteredNotes = selectedFolder 
    ? notes.filter(note => note.folderId === selectedFolder)
    : notes.filter(note => !note.folderId);

  const currentSidebarWidth = sidebarCollapsed ? 48 : sidebarWidth;

  return (
    <div className="sticky-notes-board">
      <div className="sidebar-container" style={{ width: currentSidebarWidth }}>
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          width={sidebarWidth}
          isCollapsed={sidebarCollapsed}
          onFolderSelect={setSelectedFolder}
          onFolderCreate={createFolder}
          onFolderDelete={deleteFolder}
          onFolderRename={renameFolder}
          onFolderToggle={toggleFolder}
          onWidthChange={setSidebarWidth}
          onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNoteDrop={(id, folderId) => {
            // Called on successful folder drop
            handleNoteDrop(id, folderId);
            // On folder drop, this is not a sidebar "miss" so no snap-back needed
          }}
          noteCounts={noteCounts}
          draggedNoteId={draggedNote?.id}
        />
      </div>

      <div 
        className="main-content"
        style={{ marginLeft: currentSidebarWidth }}
        onMouseUp={e => {
          // Drag ends on board (not folder/sidebar), so snap the note back
          if (draggedNote) {
            // Sidebar DOM region is from 0 to currentSidebarWidth
            if (e.clientX < currentSidebarWidth) {
              // Mouse released over sidebar, treat as "not dropped to folder"
              handleEndDrag(true);
            } else {
              // Regular drop area, do not snap back, just finish drag.
              handleEndDrag(false);
            }
          }
        }}
      >
        <div 
          className="header" 
          style={{ left: currentSidebarWidth }}
        >
          <div className="header-content">
            <h1 className="app-title">
              ✨ Sticky Spark
            </h1>
            
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
          </div>
        </div>

        <div className="board">
          {filteredNotes.length === 0 && (
            <div className="empty-state">
              <div className="empty-emoji">📝</div>
              <h2 className="empty-title">
                {selectedFolder ? 'No notes in this folder yet' : 'Ready to capture your ideas?'}
              </h2>
              <p className="empty-description">
                {selectedFolder 
                  ? 'Create your first note in this folder and start organizing your thoughts!'
                  : 'Create your first sticky note and start brainstorming. Perfect for travel plans, restaurant lists, or your next big idea!'
                }
              </p>
              <button
                onClick={createNote}
                className="create-first-note-button"
              >
                <Plus className="create-first-note-icon" />
                Create Your First Note
              </button>
            </div>
          )}

          {filteredNotes.map((note) => (
            <StickyNote
              key={note.id}
              {...note}
              onUpdate={updateNote}
              onDelete={deleteNote}
              onMove={moveNote}
              onResize={resizeNote}
              onStartDrag={() => handleStartDrag(note)}
              onEndDrag={() => handleEndDrag()}
            />
          ))}
        </div>

        <div className="grid-pattern" />
      </div>
    </div>
  );
};

export default StickyNotesBoard;
