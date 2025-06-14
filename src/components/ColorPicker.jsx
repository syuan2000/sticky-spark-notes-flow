
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
    <>
      {isPickingColor && <div className="color-picker-overlay" onClick={() => setIsPickingColor(false)} />}
      <div className="color-picker">
        {allColors.map((color) => {
          const isDefault = defaultColors.some(dc => dc.class === color.class);
          
          return (
            <div key={color.name} className="color-button-container">
              <button
                onClick={() => onColorSelect(color.class)}
                className={`color-button ${selectedColor === color.class ? 'selected' : ''} ${color.class}`}
                style={color.hex ? { backgroundColor: color.hex } : {}}
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
        
        {customColors.length < 5 && (
          <div className="color-button-container">
            {isPickingColor ? (
              <div className="color-picker-input">
                <input
                  type="color"
                  onChange={(e) => handleCustomColorAdd(e.target.value)}
                  className="color-input"
                  autoFocus
                />
                <button
                  onClick={() => setIsPickingColor(false)}
                  className="cancel-button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsPickingColor(true)}
                className="add-color-button"
              >
                <Droplet className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ColorPicker;
