
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import StickyNote from './StickyNote';
import ColorPicker from './ColorPicker';

interface Note {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
}

const StickyNotesBoard: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedColor, setSelectedColor] = useState('bg-yellow-200');

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      color: selectedColor,
      position: {
        x: Math.random() * (window.innerWidth - 300),
        y: Math.random() * (window.innerHeight - 300) + 100,
      },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-6">
        <div className="flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            ✨ Sticky Spark
          </motion.h1>
          
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
        {notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Ready to capture your ideas?
            </h2>
            <p className="text-gray-500 mb-6 max-w-md">
              Create your first sticky note and start brainstorming. Perfect for travel plans, 
              restaurant lists, or your next big idea!
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

        {notes.map((note) => (
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
  );
};

export default StickyNotesBoard;
