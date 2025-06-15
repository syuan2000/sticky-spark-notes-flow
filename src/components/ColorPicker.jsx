
import React, { useState } from 'react';
import { Droplet } from 'lucide-react';
import '../styles/ColorPicker.css';

const defaultColors = [
  { name: 'yellow', class: 'bg-yellow-200', hex: '#FEF08A' },
  { name: 'pink', class: 'bg-pink-200', hex: '#FBCFE8' },
  { name: 'blue', class: 'bg-blue-200', hex: '#BFDBFE' },
  { name: 'green', class: 'bg-green-200', hex: '#BBF7D0' },
  { name: 'purple', class: 'bg-purple-200', hex: '#E9D5FF' },
];

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  const [colors, setColors] = useState([...defaultColors, null]); // 6 slots total, last one starts empty
  const [editingColorIndex, setEditingColorIndex] = useState(null);

  const handleColorEdit = (index, newHex) => {
    const newColors = [...colors];
    if (newColors[index]) {
      // Editing existing color
      newColors[index] = {
        ...newColors[index],
        hex: newHex,
        class: `bg-[${newHex}]`
      };
    } else {
      // Adding new color to empty slot
      newColors[index] = {
        name: 'custom',
        class: `bg-[${newHex}]`,
        hex: newHex
      };
    }
    setColors(newColors);
    onColorSelect(newColors[index].class);
    setEditingColorIndex(null);
  };

  const handleColorDelete = (index) => {
    const newColors = [...colors];
    newColors[index] = null; // Set slot to empty
    setColors(newColors);
    
    // If the deleted color was selected, deselect it
    if (colors[index] && selectedColor === colors[index].class) {
      onColorSelect('bg-yellow-200'); // Default to first color
    }
  };

  const handleColorClick = (index) => {
    if (colors[index]) {
      onColorSelect(colors[index].class);
    } else {
      // Empty slot - start editing to add new color
      setEditingColorIndex(index);
    }
  };

  const handleColorDoubleClick = (index) => {
    setEditingColorIndex(index);
  };

  return (
    <div className="color-picker">
      {colors.map((color, index) => (
        <div key={index} className="color-button-container">
          {editingColorIndex === index ? (
            <input
              type="color"
              value={color?.hex || '#FEF08A'}
              onChange={(e) => handleColorEdit(index, e.target.value)}
              onBlur={() => setEditingColorIndex(null)}
              className="color-input-inline"
              autoFocus
            />
          ) : (
            <button
              onClick={() => handleColorClick(index)}
              onDoubleClick={() => handleColorDoubleClick(index)}
              onContextMenu={(e) => {
                e.preventDefault();
                if (color) {
                  handleColorDelete(index);
                }
              }}
              className={`color-button ${color && selectedColor === color.class ? 'selected' : ''} ${!color ? 'empty-slot' : ''}`}
              style={color ? { backgroundColor: color.hex } : {}}
              title={color ? `${color.name} (Double-click to edit, Right-click to delete)` : 'Click to add color'}
            >
              {!color && <Droplet className="w-4 h-4 text-gray-600" />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ColorPicker;
