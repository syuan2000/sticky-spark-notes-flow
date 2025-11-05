import React, { useState } from 'react';
import { X, GripVertical, ExternalLink, Sparkles, MapPin, ChefHat, Shirt, Wrench, RefreshCw, Instagram, Youtube, Music, Twitter, Facebook, Linkedin, Globe } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import '../styles/StickyNote.css';
import '../styles/LinkNote.css';

const LinkNote = ({
  id,
  linkData,
  color,
  position,
  size,
  onDelete,
  onMove,
  onResize,
  onStartDrag,
  onEndDrag,
  onUpdate
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [enrichedContent, setEnrichedContent] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const getSourceIcon = (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      if (hostname.includes('instagram.com')) return { name: 'Instagram', Icon: Instagram };
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return { name: 'YouTube', Icon: Youtube };
      if (hostname.includes('tiktok.com')) return { name: 'TikTok', Icon: Music };
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return { name: 'X', Icon: Twitter };
      if (hostname.includes('facebook.com')) return { name: 'Facebook', Icon: Facebook };
      if (hostname.includes('linkedin.com')) return { name: 'LinkedIn', Icon: Linkedin };
      
      return { name: linkData.metadata.siteName || 'Source', Icon: Globe };
    } catch (e) {
      return { name: 'Source', Icon: Globe };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'place': return <MapPin className="w-4 h-4" />;
      case 'recipe': return <ChefHat className="w-4 h-4" />;
      case 'outfit': return <Shirt className="w-4 h-4" />;
      case 'tool': return <Wrench className="w-4 h-4" />;
      default: return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getActionText = (type) => {
    switch (type) {
      case 'place': return 'Get more info';
      case 'recipe': return 'Show ingredients';
      case 'outfit': return 'Find similar';
      case 'tool': return 'View reviews';
      default: return 'Reclassify';
    }
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-content', {
        body: {
          type: linkData.classification.type,
          title: linkData.metadata.title,
          url: linkData.url
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to enrich content');
      }

      setEnrichedContent(data.data.enrichedContent);
      
      // Update note with enriched content
      if (onUpdate) {
        onUpdate(id, {
          ...linkData,
          enrichedContent: data.data.enrichedContent
        });
      }

      toast({
        title: "Content enriched",
        description: "Additional information has been loaded",
      });
    } catch (error) {
      console.error('Error enriching content:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to enrich content",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };
  const getProxiedImage = (imageUrl) => {
    if (!imageUrl) return null;
      const cleanUrl = imageUrl.replace(/&amp;/g, '&');
    
    // Check if it's an Instagram/Facebook CDN URL
    if (cleanUrl.includes('cdninstagram.com') || cleanUrl.includes('fbcdn.net')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
    }
    
    return cleanUrl;
  };

  const handleHorizontalResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = size.width;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(250, startWidth + (e.clientX - startX));
      onResize(id, { width: newWidth, height: size.height });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCornerResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(250, startWidth + (e.clientX - startX));
      const newHeight = Math.max(200, startHeight + (e.clientY - startY));
      onResize(id, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e) => {
    if (isResizing || e.target.closest('button') || e.target.closest('a')) return;
    e.preventDefault();
    setIsDragging(true);
    onStartDrag?.();
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });

    const handleMouseMove = (e) => {
      onMove(id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onEndDrag?.();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getBackgroundColor = () => {
    if (color.startsWith('bg-[') && color.endsWith(']')) {
      return color.slice(4, -1);
    }
    return null;
  };

  const noteStyle = {
    transform: `translate(${position.x}px, ${position.y}px) ${isDragging ? 'scale(1.05)' : 'scale(1)'}`,
    width: size.width,
    height: size.height,
    zIndex: isDragging ? 1000 : 1,
    backgroundColor: getBackgroundColor(),
  };

  const displayedEnrichedContent = enrichedContent || linkData.enrichedContent;
  const { name: sourceName, Icon: SourceIcon } = getSourceIcon(linkData.url);

  return (
    <div
      className={`sticky-note link-note ${getBackgroundColor() ? '' : color} ${isDragging ? 'dragging' : ''}`}
      style={noteStyle}
      onMouseDown={!isResizing ? handleMouseDown : undefined}
    >
      <div className="sticky-note-header">
        <GripVertical className="grip-icon" />
        <button
          onClick={() => onDelete(id)}
          className="delete-note-button"
        >
          <X className="delete-note-icon" />
        </button>
      </div>
      
      <div className="link-note-content" style={{ height: size.height - 80, overflowY: 'auto' }}>
        {linkData.metadata.image && (
          <img 
            src={getProxiedImage(linkData.metadata.image)} 
            alt={linkData.metadata.title}
            className="link-note-image"
          />
        )}
        
        <div className="link-note-header-text">
          <div className="link-note-type">
            {getTypeIcon(linkData.classification.type)}
            <span>{linkData.classification.type}</span>
          </div>
          <button
            onClick={() => window.open(linkData.url, '_blank', 'noopener,noreferrer')}
            className="link-note-source-button"
          >
            <SourceIcon className="w-4 h-4" />
            <span>Source</span>
          </button>
        </div>

        <p className="link-note-summary">{linkData.classification.summary}</p>

        <div className="link-note-tags">
          {linkData.classification.tags.map((tag, idx) => (
            <span key={idx} className="link-note-tag">
              {tag}
            </span>
          ))}
        </div>

        {displayedEnrichedContent && (
          <div className="link-note-enriched">
            <div className="link-note-enriched-header">
              <Sparkles className="w-4 h-4" />
              <span>Additional Info</span>
            </div>
            <div className="link-note-enriched-content">
              {displayedEnrichedContent}
            </div>
          </div>
        )}

        <button
          onClick={handleEnrich}
          disabled={isEnriching}
          className="link-note-action"
        >
          {isEnriching ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {getActionText(linkData.classification.type)}
            </>
          )}
        </button>
      </div>

      <div
        onMouseDown={handleHorizontalResizeStart}
        className="horizontal-resize-edge"
      />
      <div
        onMouseDown={handleCornerResizeStart}
        className="corner-resize-area"
      />
    </div>
  );
};

export default LinkNote;