import React, { useState } from 'react';
import { X, Circle } from 'lucide-react';
import '../styles/ColorPicker.css';

const defaultColors = [
  { name: 'beige', class: 'bg-notion-beige', hex: '#F7F6F3' },
  { name: 'peach', class: 'bg-notion-peach', hex: '#FADEC9' },
  { name: 'yellow', class: 'bg-notion-yellow', hex: '#FBF3DB' },
  { name: 'green', class: 'bg-notion-green', hex: '#D4E4BC' },
  { name: 'blue', class: 'bg-notion-blue', hex: '#D3E5EF' },
  { name: 'purple', class: 'bg-notion-purple', hex: '#E8DEEE' },
  { name: 'pink', class: 'bg-notion-pink', hex: '#F5E0E9' },
  { name: 'red', class: 'bg-notion-red', hex: '#FFE2DD' },
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
        onColorSelect('bg-notion-beige');
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
        onColorSelect('bg-notion-beige');
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
            value={customColor?.hex || '#E8DEEE'} // Default to Notion purple
            onChange={e => handleCustomEdit(e.target.value)}
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
              <Circle className="w-4 h-4 text-gray-600" />
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
