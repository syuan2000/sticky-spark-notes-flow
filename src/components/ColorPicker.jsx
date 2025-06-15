
import React, { useState } from 'react';
import { Droplet, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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
  const [colors, setColors] = useState(defaultColors);
  const [customColor, setCustomColor] = useState(null);
  const [editingColorIndex, setEditingColorIndex] = useState(null);
  const [isCustomColorOpen, setIsCustomColorOpen] = useState(false);

  const handleColorEdit = (index, newHex) => {
    const newColors = [...colors]; 
    const newClass = `bg-[${newHex}]`;
    newColors[index] = {
      ...newColors[index],
      hex: newHex,
      class: newClass
    };
    setColors(newColors);
    onColorSelect(newClass);
    setEditingColorIndex(null);
  };

  const handleCustomColorSelect = (hex) => {
    const customClass = `bg-[${hex}]`;
    setCustomColor({ hex, class: customClass });
    onColorSelect(customClass);
    setIsCustomColorOpen(false);
  };

  const handleColorClick = (color) => {
    onColorSelect(color.class);
  };

  const handleColorDoubleClick = (index) => {
    setEditingColorIndex(index);
  };

  return (
    <div className="color-picker">
      {colors.map((color, index) => (
        <div key={color.name} className="color-button-container">
          {editingColorIndex === index ? (
            <Popover open={true} onOpenChange={() => setEditingColorIndex(null)}>
              <PopoverTrigger asChild>
                <button
                  className={`color-button ${selectedColor === color.class ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hex }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    defaultValue={color.hex}
                    onChange={(e) => handleColorEdit(index, e.target.value)}
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
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={() => handleColorClick(color)}
              onDoubleClick={() => handleColorDoubleClick(index)}
              className={`color-button ${selectedColor === color.class ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex }}
            />
          )}
        </div>
      ))}

      <div className="color-button-container">
        <Popover open={isCustomColorOpen} onOpenChange={setIsCustomColorOpen}>
          <PopoverTrigger asChild>
            <button
              className={`color-button custom-color-button ${selectedColor === customColor?.class ? 'selected' : ''}`}
              style={customColor ? { backgroundColor: customColor.hex } : {}}
            >
              {!customColor && <Droplet className="w-4 h-4 text-gray-600" />}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top">
            <div className="flex items-center gap-2">
              <input
                type="color"
                onChange={(e) => handleCustomColorSelect(e.target.value)}
                className="color-input"
                autoFocus
              />
              <button
                onClick={() => setIsCustomColorOpen(false)}
                className="cancel-button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorPicker;
