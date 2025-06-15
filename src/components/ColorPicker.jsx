
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
  const [customColor, setCustomColor] = useState(null);
  const [editingColorIndex, setEditingColorIndex] = useState(null);
  const [colors, setColors] = useState(defaultColors);

  const handleColorCustomize = (colorIndex, isCustom = false) => {
    setEditingColorIndex(isCustom ? 'custom' : colorIndex);
  };

  const handleColorChange = (newHex) => {
    if (editingColorIndex === 'custom') {
      const newCustomColor = {
        name: `custom-${Date.now()}`,
        class: `bg-[${newHex}]`,
        hex: newHex
      };
      setCustomColor(newCustomColor);
      onColorSelect(newCustomColor.class);
    } else if (editingColorIndex !== null) {
      const updatedColors = [...colors];
      updatedColors[editingColorIndex] = {
        ...updatedColors[editingColorIndex],
        hex: newHex,
        class: `bg-[${newHex}]`
      };
      setColors(updatedColors);
      onColorSelect(updatedColors[editingColorIndex].class);
    }
    setEditingColorIndex(null);
  };

  const handleColorSelect = (colorClass) => {
    onColorSelect(colorClass);
  };

  const allColors = [...colors];
  if (customColor) {
    allColors.push(customColor);
  }

  return (
    <div className="color-picker">
      {colors.map((color, index) => (
        <div key={color.name} className="color-button-container">
          <button
            onClick={() => handleColorSelect(color.class)}
            onDoubleClick={() => handleColorCustomize(index)}
            className={`color-button ${selectedColor === color.class ? 'selected' : ''}`}
            style={{ backgroundColor: color.hex }}
            title="Click to select, double-click to customize"
          />
        </div>
      ))}
      
      <div className="color-button-container">
        {editingColorIndex === 'custom' ? (
          <div className="color-picker-input">
            <input
              type="color"
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-input"
              autoFocus
            />
            <button
              onClick={() => setEditingColorIndex(null)}
              className="cancel-button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : customColor ? (
          <button
            onClick={() => handleColorSelect(customColor.class)}
            onDoubleClick={() => handleColorCustomize(null, true)}
            className={`color-button ${selectedColor === customColor.class ? 'selected' : ''}`}
            style={{ backgroundColor: customColor.hex }}
            title="Click to select, double-click to customize"
          />
        ) : (
          <button
            onClick={() => handleColorCustomize(null, true)}
            className="add-color-button"
            title="Click to add custom color"
          >
            <Droplet className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {editingColorIndex !== null && editingColorIndex !== 'custom' && (
        <div className="color-picker-overlay">
          <div className="color-picker-input">
            <input
              type="color"
              defaultValue={colors[editingColorIndex].hex}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-input"
              autoFocus
            />
            <button
              onClick={() => setEditingColorIndex(null)}
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
