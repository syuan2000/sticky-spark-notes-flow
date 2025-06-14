
import React, { useState } from 'react';
import { Droplet, X } from 'lucide-react';
import '../styles/ColorPicker.css';

const defaultColors = [
  { name: 'yellow', class: 'bg-yellow-200', hex: '#FEF08A' },
  { name: 'pink', class: 'bg-pink-200', hex: '#FBCFE8' },
  { name: 'blue', class: 'bg-blue-200', hex: '#BFDBFE' },
  { name: 'green', class: 'bg-green-200', hex: '#BBF7D0' },
  { name: 'purple', class: 'bg-purple-200', hex: '#E9D5FF' },
  { name: 'orange', class: 'bg-orange-200', hex: '#FED7AA' },
];

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  const [customColors, setCustomColors] = useState([]);
  const [deletedDefaultColors, setDeletedDefaultColors] = useState([]);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState(null);

  const handleCustomColorAdd = (hex) => {
    if (customColors.length >= 5) return;
    
    const customClass = `bg-[${hex}]`;
    const newColor = {
      name: `custom-${Date.now()}`,
      class: customClass,
      hex: hex
    };
    
    setCustomColors([...customColors, newColor]);
    onColorSelect(customClass);
    setIsPickingColor(false);
  };

  const handleColorCustomize = (colorIndex, hex, isDefault = false) => {
    if (isDefault) {
      // Convert default color to custom color with new hex
      const originalColor = defaultColors[colorIndex];
      const customClass = `bg-[${hex}]`;
      const newColor = {
        name: `custom-${Date.now()}`,
        class: customClass,
        hex: hex
      };
      
      setCustomColors([...customColors, newColor]);
      setDeletedDefaultColors([...deletedDefaultColors, originalColor.class]);
      onColorSelect(customClass);
    } else {
      // Update existing custom color
      const updatedCustomColors = [...customColors];
      const customClass = `bg-[${hex}]`;
      updatedCustomColors[colorIndex] = {
        ...updatedCustomColors[colorIndex],
        class: customClass,
        hex: hex
      };
      setCustomColors(updatedCustomColors);
      onColorSelect(customClass);
    }
    setEditingColorIndex(null);
  };

  const handleColorDelete = (colorToDelete, isDefault = false) => {
    if (isDefault) {
      setDeletedDefaultColors([...deletedDefaultColors, colorToDelete]);
    } else {
      setCustomColors(customColors.filter(color => color.class !== colorToDelete));
    }
    
    if (selectedColor === colorToDelete) {
      const availableColors = [
        ...defaultColors.filter(c => !deletedDefaultColors.includes(c.class)),
        ...customColors.filter(c => c.class !== colorToDelete)
      ];
      if (availableColors.length > 0) {
        onColorSelect(availableColors[0].class);
      }
    }
  };

  const availableDefaultColors = defaultColors.filter(color => !deletedDefaultColors.includes(color.class));
  const allColors = [...availableDefaultColors, ...customColors];
  const totalSlots = 6;
  const emptySlots = Math.max(0, totalSlots - allColors.length - (customColors.length < 5 ? 1 : 0));

  return (
    <div className="color-picker">
      {allColors.map((color, index) => {
        const isDefault = defaultColors.some(dc => dc.class === color.class);
        const actualIndex = isDefault ? defaultColors.findIndex(dc => dc.class === color.class) : index - availableDefaultColors.length;
        const isEditing = editingColorIndex === `${isDefault ? 'default' : 'custom'}-${actualIndex}`;
        
        return (
          <div key={color.name} className="color-button-container">
            {isEditing ? (
              <div className="color-picker-input">
                <input
                  type="color"
                  defaultValue={color.hex}
                  onChange={(e) => handleColorCustomize(actualIndex, e.target.value, isDefault)}
                  className="color-input pixelated-background"
                  autoFocus
                />
                <button
                  onClick={() => setEditingColorIndex(null)}
                  className="cancel-button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    if (e.detail === 1) {
                      // Single click - select color
                      onColorSelect(color.class);
                    } else if (e.detail === 2) {
                      // Double click - customize color
                      setEditingColorIndex(`${isDefault ? 'default' : 'custom'}-${actualIndex}`);
                    }
                  }}
                  className={`color-button ${selectedColor === color.class ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleColorDelete(color.class, isDefault);
                  }}
                  className="delete-button"
                >
                  <X className="w-2 h-2" />
                </button>
              </>
            )}
          </div>
        );
      })}
      
      {/* Placeholder slots */}
      {Array.from({ length: emptySlots }).map((_, index) => (
        <div
          key={`placeholder-${index}`}
          className="placeholder-slot"
        />
      ))}
      
      {customColors.length < 5 && !isPickingColor && editingColorIndex === null && (
        <div className="color-button-container">
          <button
            onClick={() => setIsPickingColor(true)}
            className="add-color-button"
          >
            <Droplet className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
      
      {isPickingColor && (
        <div className="color-button-container">
          <div className="color-picker-input">
            <input
              type="color"
              onChange={(e) => handleCustomColorAdd(e.target.value)}
              className="color-input pixelated-background"
              autoFocus
            />
            <button
              onClick={() => setIsPickingColor(false)}
              className="cancel-button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
