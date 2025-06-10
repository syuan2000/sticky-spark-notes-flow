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
  const [draggedNote, setDraggedNote] = useState(null);
  const [draggedNoteOriginalPosition, setDraggedNoteOriginalPosition] = useState(null);

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

  const moveNote = (id, position) => {
    const currentSidebarWidth = sidebarCollapsed ? 48 : sidebarWidth;
    const constrainedPosition = {
      x: Math.max(currentSidebarWidth, position.x),
      y: Math.max(0, position.y)
    };
    
    setNotes(notes.map(note => 
      note.id === id ? { ...note, position: constrainedPosition } : note
    ));
  };

  const resizeNote = (id, size) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, size } : note
    ));
  };

  const handleNoteDrop = (noteId, folderId) => {
    setNotes(notes.map(note => 
      note.id === noteId ? { ...note, folderId: folderId || undefined } : note
    ));
    setDraggedNote(null);
    setDraggedNoteOriginalPosition(null);
  };

  const handleNoteDragStart = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    setDraggedNote(noteId);
    setDraggedNoteOriginalPosition(note.position);
  };

  const handleNoteDragEnd = () => {
    // If note wasn't dropped in a folder, return to original position
    if (draggedNote && draggedNoteOriginalPosition) {
      setNotes(notes.map(note => 
        note.id === draggedNote ? { ...note, position: draggedNoteOriginalPosition } : note
      ));
    }
    setDraggedNote(null);
    setDraggedNoteOriginalPosition(null);
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
  const noteCounts = getAllNoteCounts();

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
          onNoteDrop={handleNoteDrop}
          noteCounts={noteCounts}
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
            <div
              key={note.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', note.id);
                handleNoteDragStart(note.id);
              }}
              onDragEnd={handleNoteDragEnd}
              className={`note-container ${draggedNote === note.id ? 'dragging' : ''}`}
            >
              <StickyNote
                id={note.id}
                content={note.content}
                color={note.color}
                position={note.position}
                size={note.size}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onMove={moveNote}
                onResize={resizeNote}
              />
            </div>
          ))}
        </div>

        <div className="grid-pattern" />
      </div>
    </div>
  );
};

export default StickyNotesBoard;
