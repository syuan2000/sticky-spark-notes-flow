import React, { useState } from 'react';
import { Plus, Link, StickyNote as NoteIcon, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import '../styles/NewNoteDialog.css';

const NewNoteDialog = ({ open, onClose, onCreateNote, onCreateLink }) => {
  const [mode, setMode] = useState(null); // null or 'link'
  const [linkUrl, setLinkUrl] = useState('');

  const handleClose = () => {
    setMode(null);
    setLinkUrl('');
    onClose();
  };

  const handleCreateNote = () => {
    onCreateNote();
    handleClose();
  };

  const handleCreateLink = () => {
    if (linkUrl.trim()) {
      onCreateLink(linkUrl.trim());
      handleClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && linkUrl.trim()) {
      handleCreateLink();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="new-note-dialog">
        <DialogHeader>
          <DialogTitle>Create New</DialogTitle>
        </DialogHeader>

        {!mode ? (
          <div className="new-note-options">
            <button
              onClick={handleCreateNote}
              className="new-note-option"
            >
              <NoteIcon className="w-8 h-8" />
              <span className="new-note-option-title">Note</span>
              <span className="new-note-option-desc">Create a blank sticky note</span>
            </button>

            <button
              onClick={() => setMode('link')}
              className="new-note-option"
            >
              <Link className="w-8 h-8" />
              <span className="new-note-option-title">Link</span>
              <span className="new-note-option-desc">Parse and save a link</span>
            </button>
          </div>
        ) : (
          <div className="new-note-link-form">
            <div className="new-note-link-input-wrapper">
              <Input
                type="url"
                placeholder="Paste link (TikTok, YouTube, blog, etc.)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
                className="new-note-link-input"
              />
            </div>
            <div className="new-note-actions">
              <Button variant="outline" onClick={() => setMode(null)}>
                Back
              </Button>
              <Button 
                onClick={handleCreateLink}
                disabled={!linkUrl.trim()}
              >
                <Link className="w-4 h-4 mr-2" />
                Parse Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewNoteDialog;