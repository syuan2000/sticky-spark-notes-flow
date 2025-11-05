import React, { useState } from 'react';
import { X, GripVertical, ExternalLink, Sparkles, MapPin, ChefHat, Shirt, Wrench, RefreshCw, Instagram, Youtube, Music, Twitter, Facebook, Linkedin, Globe, Send, Clock, Star, Navigation } from 'lucide-react';
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
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpAnswers, setFollowUpAnswers] = useState([]);

  const getSourceIcon = (url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      if (hostname.includes('instagram.com')) return { name: 'Instagram', Icon: Instagram };
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return { name: 'YouTube', Icon: Youtube };
      if (hostname.includes('tiktok.com')) return { name: 'TikTok', Icon: Music };
      if (hostname.includes('facebook.com')) return { name: 'Facebook', Icon: Facebook };
      
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
      
      if (onUpdate) {
        onUpdate(id, {
          ...linkData,
          enrichedContent: data.data.enrichedContent
        });
      }

      toast({
        title: "Details loaded",
        description: "Key information has been added",
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

  const handleFollowUpQuestion = async () => {
    if (!followUpQuestion.trim()) return;
    
    setIsAskingFollowUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('answer-question', {
        body: {
          question: followUpQuestion,
          context: {
            title: linkData.metadata.title,
            url: linkData.url,
            type: linkData.classification.type,
            existingInfo: enrichedContent
          }
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to get answer');
      }

      const newAnswer = { question: followUpQuestion, answer: data.data.answer };
      setFollowUpAnswers([...followUpAnswers, newAnswer]);
      
      setFollowUpQuestion('');
      toast({
        title: "Answer added",
        description: "Your question has been answered",
      });
    } catch (error) {
      console.error('Error asking follow-up:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get answer",
        variant: "destructive",
      });
    } finally {
      setIsAskingFollowUp(false);
    }
  };

const openInMaps = (address) => {
  const encoded = encodeURIComponent(address);
  const appleUrl = `https://maps.apple.com/?q=${encoded}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  const useApple = window.confirm("Open in Apple Maps? Click Cancel for Google Maps.");
  const mapsUrl = useApple ? appleUrl : googleUrl;
  
  window.open(mapsUrl, "_blank");
};


  const getProxiedImage = (imageUrl) => {
    if (!imageUrl) return null;
    const cleanUrl = imageUrl.replace(/&amp;/g, '&');
    
    if (cleanUrl.includes('cdninstagram.com') || cleanUrl.includes('fbcdn.net')) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
    }
    
    return cleanUrl;
  };

  const renderSingleItem = (item) => {
    return (
      <div className="enriched-item-card">
        {item.name && (
          <div className="enriched-item-name">{item.name}</div>
        )}
        
        {item.category && (
          <div className="enriched-item-category">{item.category}</div>
        )}

        <div className="enriched-details">
          {item.address && (
            <div className="enriched-row">
              <Navigation className="enriched-icon" />
              <button 
                onClick={() => openInMaps(item.address)}
                className="enriched-link"
              >
                {item.address}
              </button>
            </div>
          )}

          {item.hours && (
            <div className="enriched-row">
              <Clock className="enriched-icon" />
              <span>{item.hours}</span>
            </div>
          )}

          {item.rating && (
            <div className="enriched-row">
              <Star className="enriched-icon" />
              <span>{item.rating}</span>
            </div>
          )}
        </div>

        {item.key_info && item.key_info.length > 0 && (
          <div className="enriched-key-info">
            {item.key_info.map((info, idx) => (
              <div key={idx} className="key-info-item">• {info}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderEnrichedContent = (data) => {
    if (!data) return null;

    // Check if it's multiple items
    if (data.items && Array.isArray(data.items)) {
      return (
        <div className="enriched-multiple">
          {data.items.map((item, idx) => (
            <div key={idx}>
              {renderSingleItem(item)}
              {idx < data.items.length - 1 && <div className="enriched-divider" />}
            </div>
          ))}
        </div>
      );
    }

    // Single item
    return renderSingleItem(data);
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

  const handleHeaderMouseDown = (e) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) {
      return;
    }
    
    if (isResizing) return;
    
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
    >
      <div 
        className="sticky-note-header"
        onMouseDown={handleHeaderMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <GripVertical className="grip-icon" />
        <button
          onClick={() => onDelete(id)}
          className="delete-note-button"
          onMouseDown={(e) => e.stopPropagation()}
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
            onError={(e) => { e.currentTarget.style.display = 'none' }}
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
            {renderEnrichedContent(displayedEnrichedContent)}
          </div>
        )}

        {followUpAnswers.length > 0 && (
          <div className="followup-answers">
            {followUpAnswers.map((qa, idx) => (
              <div key={idx} className="followup-qa">
                <div className="followup-q">Q: {qa.question}</div>
                <div className="followup-a">{qa.answer}</div>
              </div>
            ))}
          </div>
        )}

        {!displayedEnrichedContent ? (
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
                Get Details
              </>
            )}
          </button>
        ) : (
          <div className="link-note-followup">
            <div className="link-note-followup-input">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFollowUpQuestion()}
                placeholder="Ask anything... (wifi, parking, menu)"
                disabled={isAskingFollowUp}
                className="followup-input"
              />
              <button
                onClick={handleFollowUpQuestion}
                disabled={isAskingFollowUp || !followUpQuestion.trim()}
                className="followup-button"
              >
                {isAskingFollowUp ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
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