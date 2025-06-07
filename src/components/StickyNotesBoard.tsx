
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Menu, X } from 'lucide-react';
import StickyNote from './StickyNote';
import ColorPicker from './ColorPicker';
import FolderSidebar, { Folder } from './FolderSidebar';

interface Note {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  folderId?: string;
}

const StickyNotesBoard: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedColor, setSelectedColor] = useState('bg-yellow-200');
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'travel', name: 'Travel Ideas', isExpanded: true, children: [] },
    { id: 'restaurants', name: 'Restaurants', isExpanded: false, children: [] },
    { id: 'work', name: 'Work Projects', isExpanded: false, children: [] },
  ]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      color: selectedColor,
      position: {
        x: Math.random() * (window.innerWidth - 400),
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
      folderId: selectedFolder || undefined,
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const moveNote = (id: string, position: { x: number; y: number }) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, position } : note
    ));
  };

  const createFolder = (parentId?: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: 'New Folder',
      isExpanded: true,
      children: [],
    };

    if (parentId) {
      // Add as child to parent folder
      const updateFoldersRecursively = (folderList: Folder[]): Folder[] => {
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
      // Add as root folder
      setFolders([...folders, newFolder]);
    }
  };

  const deleteFolder = (folderId: string) => {
    const deleteFolderRecursively = (folderList: Folder[]): Folder[] => {
      return folderList
        .filter(folder => folder.id !== folderId)
        .map(folder => ({
          ...folder,
          children: folder.children ? deleteFolderRecursively(folder.children) : undefined,
        }));
    };
    setFolders(deleteFolderRecursively(folders));
    
    // Move notes from deleted folder to root
    setNotes(notes.map(note => 
      note.folderId === folderId ? { ...note, folderId: undefined } : note
    ));
    
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
  };

  const renameFolder = (folderId: string, newName: string) => {
    const renameFolderRecursively = (folderList: Folder[]): Folder[] => {
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

  const toggleFolder = (folderId: string) => {
    const toggleFolderRecursively = (folderList: Folder[]): Folder[] => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden flex">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full z-40"
      >
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onFolderSelect={setSelectedFolder}
          onFolderCreate={createFolder}
          onFolderDelete={deleteFolder}
          onFolderRename={renameFolder}
          onFolderToggle={toggleFolder}
        />
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <div className="fixed top-0 right-0 left-0 z-50 p-6" style={{ left: sidebarOpen ? '256px' : '0' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-gray-800"
              >
                ✨ Sticky Spark
              </motion.h1>
            </div>
            
            <div className="flex items-center gap-4">
              <ColorPicker 
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
              
              <motion.button
                onClick={createNote}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow text-gray-700 font-medium"
              >
                <Plus className="w-5 h-5" />
                New Note
              </motion.button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="absolute inset-0 pt-24">
          {filteredNotes.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">
                {selectedFolder ? 'No notes in this folder yet' : 'Ready to capture your ideas?'}
              </h2>
              <p className="text-gray-500 mb-6 max-w-md">
                {selectedFolder 
                  ? 'Create your first note in this folder and start organizing your thoughts!'
                  : 'Create your first sticky note and start brainstorming. Perfect for travel plans, restaurant lists, or your next big idea!'
                }
              </p>
              <motion.button
                onClick={createNote}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-lg font-medium text-gray-800 shadow-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Your First Note
              </motion.button>
            </motion.div>
          )}

          {filteredNotes.map((note) => (
            <StickyNote
              key={note.id}
              id={note.id}
              content={note.content}
              color={note.color}
              position={note.position}
              onUpdate={updateNote}
              onDelete={deleteNote}
              onMove={moveNote}
            />
          ))}
        </div>

        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
    </div>
  );
};

export default StickyNotesBoard;
