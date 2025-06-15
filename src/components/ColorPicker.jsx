
import React, { useState } from 'react';
import { Droplet, X } from 'lucide-react';
import '../styles/ColorPicker.css';

const defaultColors = [
  { name: 'yellow', class: 'bg-yellow-200', hex: '#FEF08A' },
  { name: 'pink', class: 'bg-pink-200', hex: '#FBCFE8' },
  { name: 'blue', class: 'bg-blue-200', hex: '#BFDBFE' },
  { name: 'green', class: 'bg-green-200', hex: '#BBF7D0' },
  { name: 'purple', class: 'bg-purple-200', hex: '#E9D5FF' },
];

const SLOT_COUNT = 6;

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  // Fill out to 6 slots total, extra slot as empty initially
  const [colors, setColors] = useState([
    ...defaultColors,
    null,
  ]);

  const [editingColorIndex, setEditingColorIndex] = useState(null);

  // Always fill up to 6 slots with all nulls at the end
  const normalizeColors = (colorsArr) => {
    const nonNulls = colorsArr.filter(Boolean);
    while (nonNulls.length < SLOT_COUNT) {
      nonNulls.push(null);
    }
    return nonNulls.slice(0, SLOT_COUNT);
  };

  const handleColorEdit = (index, newHex) => {
    let newColors = [...colors];
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
    newColors = normalizeColors(newColors);
    setColors(newColors);
    onColorSelect(newColors[index].class);
    setEditingColorIndex(null);
  };

  const handleColorDelete = (index) => {
    let newColors = [...colors];
    newColors[index] = null;
    newColors = normalizeColors(newColors); // All nulls (empty slots) shift right

    setColors(newColors);

    // If the deleted color was selected, reset to first available one or default
    if (
      colors[index] &&
      selectedColor === colors[index].class
    ) {
      const first = newColors.find((c) => c !== null);
      onColorSelect(first ? first.class : 'bg-yellow-200');
    }
  };

  const handleColorClick = (index) => {
    if (colors[index]) {
      onColorSelect(colors[index].class);
    } else {
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
              value={color?.hex || ''}
              onChange={(e) => handleColorEdit(index, e.target.value)}
              onBlur={() => setEditingColorIndex(null)}
              className="color-input-inline"
              autoFocus
            />
          ) : (
            <button
              onClick={() => handleColorClick(index)}
              onDoubleClick={() => handleColorDoubleClick(index)}
              className={`color-button ${color && selectedColor === color.class ? 'selected' : ''} ${!color ? 'empty-slot' : ''}`}
              style={color ? { backgroundColor: color.hex } : {}}
              title={color ? `${color.name} (Double-click to edit)` : 'Click to add color'}
              tabIndex={0}
            >
              {!color && <Droplet className="w-4 h-4 text-gray-600" />}
              {/* Delete button: appear only on hover over non-empty slot */}
              {color && (
                <span
                  className="color-delete-btn"
                  onClick={e => {
                    e.stopPropagation();
                    handleColorDelete(index);
                  }}
                  tabIndex={-1}
                  title="Delete color"
                >
                  <X size={14} />
                </span>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ColorPicker;
