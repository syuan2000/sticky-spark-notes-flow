
import React, { useState } from 'react';
import { X, ColorWheel } from 'lucide-react';
import '../styles/ColorPicker.css';

const defaultColors = [
  { name: 'yellow', class: 'bg-yellow-200', hex: '#FEF08A' },
  { name: 'pink', class: 'bg-pink-200', hex: '#FBCFE8' },
  { name: 'blue', class: 'bg-blue-200', hex: '#BFDBFE' },
  { name: 'green', class: 'bg-green-200', hex: '#BBF7D0' },
  { name: 'purple', class: 'bg-purple-200', hex: '#E9D5FF' },
];

const MAX_SLOT = 6; // 5 fixed + 1 custom

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  // State: regular (predefined) colors
  const [regularColors, setRegularColors] = useState([...defaultColors]);
  // State: single custom slot. Null if unset, else { name: 'custom', ... }
  const [customColor, setCustomColor] = useState(null);
  // State: tracking editing for regular/custom, use 'custom' for custom slot
  const [editingColorIndex, setEditingColorIndex] = useState(null);

  // Handler for editing regular color slot
  const handleColorEdit = (index, newHex) => {
    const updatedColors = [...regularColors];
    updatedColors[index] = {
      ...updatedColors[index],
      hex: newHex,
      class: `bg-[${newHex}]`,
    };
    setRegularColors(updatedColors);
    onColorSelect(updatedColors[index].class);
    setEditingColorIndex(null);
  };

  // Handler for deleting regular color slot
  const handleColorDelete = (index) => {
    const colorsCopy = [...regularColors];
    const deleted = colorsCopy.splice(index, 1);
    setRegularColors(colorsCopy);

    // If deleted color was selected, select next slot if present,
    // customColor if selected, or fallback to first.
    if (
      deleted[0] &&
      selectedColor === deleted[0].class
    ) {
      if (colorsCopy.length > 0) {
        onColorSelect(colorsCopy[0].class);
      } else if (customColor) {
        onColorSelect(customColor.class);
      } else {
        onColorSelect('bg-yellow-200');
      }
    }
  };

  // Handler for editing custom slot (create or edit)
  const handleCustomEdit = (newHex) => {
    const newCustom = {
      name: 'custom',
      class: `bg-[${newHex}]`,
      hex: newHex,
    };
    setCustomColor(newCustom);
    onColorSelect(newCustom.class);
    setEditingColorIndex(null);
  };

  // Handler for deleting custom color (returns to empty custom slot)
  const handleCustomDelete = () => {
    if (selectedColor === (customColor?.class)) {
      // Fallback to first available regularColor or hardcoded
      if (regularColors.length > 0) {
        onColorSelect(regularColors[0].class);
      } else {
        onColorSelect('bg-yellow-200');
      }
    }
    setCustomColor(null);
    setEditingColorIndex(null);
  };

  // On click for regular color slot
  const handleRegularClick = (index) => {
    if (regularColors[index]) {
      if (selectedColor === regularColors[index].class) {
        setEditingColorIndex(index);
      } else {
        onColorSelect(regularColors[index].class);
      }
    }
  };

  // On click for custom slot
  const handleCustomClick = () => {
    if (customColor) {
      if (selectedColor === customColor.class) {
        setEditingColorIndex('custom');
      } else {
        onColorSelect(customColor.class);
      }
    } else {
      setEditingColorIndex('custom');
    }
  };

  // Show up to 5 regular slots, custom slot is always last
  const numRegularSlots = Math.min(regularColors.length, MAX_SLOT - 1);

  return (
    <div className="color-picker">
      {/* Render regular (predefined) slots */}
      {regularColors.slice(0, MAX_SLOT - 1).map((color, idx) => (
        <div key={idx} className="color-button-container">
          {editingColorIndex === idx ? (
            <input
              type="color"
              value={color.hex}
              onChange={(e) => handleColorEdit(idx, e.target.value)}
              onBlur={() => setEditingColorIndex(null)}
              className="color-input-inline"
              autoFocus
            />
          ) : (
            <button
              onClick={() => handleRegularClick(idx)}
              className={`color-button ${selectedColor === color.class ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex }}
              title={`${color.name} (Click again to edit)`}
              tabIndex={0}
            >
              {/* Delete button only on hover */}
              <span
                className="color-delete-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleColorDelete(idx);
                }}
                tabIndex={-1}
                title="Delete color"
              >
                <X size={14} />
              </span>
            </button>
          )}
        </div>
      ))}

      {/* Always show the custom slot as last */}
      <div className="color-button-container">
        {editingColorIndex === 'custom' ? (
          <input
            type="color"
            value={customColor?.hex || '#FFFF00'}
            onChange={e => handleCustomEdit(e.target.value)}
            onBlur={() => setEditingColorIndex(null)}
            className="color-input-inline"
            autoFocus
          />
        ) : (
          <button
            onClick={handleCustomClick}
            className={`color-button ${customColor && selectedColor === customColor.class ? 'selected' : ''} ${!customColor ? 'empty-slot' : ''}`}
            style={customColor ? { backgroundColor: customColor.hex } : {}}
            title={customColor ? 'Custom color (Click again to edit)' : 'Add custom color'}
            tabIndex={0}
          >
            {!customColor && (
              <ColorWheel className="w-4 h-4 text-gray-600" />
            )}
            {customColor && (
              <span
                className="color-delete-btn"
                onClick={e => {
                  e.stopPropagation();
                  handleCustomDelete();
                }}
                tabIndex={-1}
                title="Delete custom color"
              >
                <X size={14} />
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
