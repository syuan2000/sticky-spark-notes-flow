
import React, { useState } from 'react';
import { Droplet } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import '../styles/ColorPicker.css';

const defaultColors = [
  { name: 'yellow', class: 'bg-yellow-200', hex: '#FEF08A' },
  { name: 'pink', class: 'bg-pink-200', hex: '#FBCFE8' },
  { name: 'blue', class: 'bg-blue-200', hex: '#BFDBFE' },
  { name: 'green', class: 'bg-green-200', hex: '#BBF7D0' },
  { name: 'purple', class: 'bg-purple-200', hex: '#E9D5FF' },
];

const ColorPicker = ({ selectedColor, onColorSelect }) => {
  const [colors, setColors] = useState(defaultColors);
  const [customColor, setCustomColor] = useState(null);
  const [editingColorIndex, setEditingColorIndex] = useState(null);
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);

  const handleColorEdit = (index, newHex) => {
    const newColors = [...colors];
    newColors[index] = {
      ...newColors[index],
      hex: newHex,
      class: `bg-[${newHex}]`
    };
    setColors(newColors);
    onColorSelect(newColors[index].class);
    setEditingColorIndex(null);
  };

  const handleCustomColorSelect = (hex) => {
    const newCustomColor = {
      name: 'custom',
      class: `bg-[${hex}]`,
      hex: hex
    };
    setCustomColor(newCustomColor);
    onColorSelect(newCustomColor.class);
    setIsCustomPickerOpen(false);
  };

  return (
    <div className="color-picker">
      {colors.map((color, index) => (
        <div key={color.name} className="color-button-container">
          {editingColorIndex === index ? (
            <Popover open={true} onOpenChange={() => setEditingColorIndex(null)}>
              <PopoverTrigger asChild>
                <button
                  className="color-button"
                  style={{ backgroundColor: color.hex }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) => handleColorEdit(index, e.target.value)}
                  className="w-8 h-8 border-none cursor-pointer"
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <button
              onClick={() => onColorSelect(color.class)}
              onDoubleClick={() => setEditingColorIndex(index)}
              className={`color-button ${selectedColor === color.class ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex }}
            />
          )}
        </div>
      ))}
      
      <div className="color-button-container">
        <Popover open={isCustomPickerOpen} onOpenChange={setIsCustomPickerOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={() => setIsCustomPickerOpen(true)}
              onDoubleClick={() => setIsCustomPickerOpen(true)}
              className={`color-button ${customColor && selectedColor === customColor.class ? 'selected' : ''} ${!customColor ? 'custom-slot' : ''}`}
              style={customColor ? { backgroundColor: customColor.hex } : {}}
            >
              {!customColor && <Droplet className="w-4 h-4 text-gray-600" />}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" side="top">
            <input
              type="color"
              onChange={(e) => handleCustomColorSelect(e.target.value)}
              className="w-8 h-8 border-none cursor-pointer"
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ColorPicker;
