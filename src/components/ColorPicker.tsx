
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';

const defaultColors = [
  { name: 'yellow', class: 'bg-yellow-200', hex: '#FEF08A' },
  { name: 'pink', class: 'bg-pink-200', hex: '#FBCFE8' },
  { name: 'blue', class: 'bg-blue-200', hex: '#BFDBFE' },
  { name: 'green', class: 'bg-green-200', hex: '#BBF7D0' },
  { name: 'purple', class: 'bg-purple-200', hex: '#E9D5FF' },
  { name: 'orange', class: 'bg-orange-200', hex: '#FED7AA' },
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  const [customColors, setCustomColors] = useState<Array<{ name: string; class: string; hex: string }>>([]);
  const [isPickingColor, setIsPickingColor] = useState(false);

  const handleCustomColorAdd = (hex: string) => {
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

  const handleCustomColorDelete = (colorToDelete: string) => {
    setCustomColors(customColors.filter(color => color.class !== colorToDelete));
    if (selectedColor === colorToDelete) {
      onColorSelect(defaultColors[0].class);
    }
  };

  const allColors = [...defaultColors, ...customColors];

  return (
    <div className="flex gap-2 p-2 bg-white rounded-lg shadow-md border">
      {allColors.map((color) => (
        <div key={color.name} className="relative group">
          <motion.button
            onClick={() => onColorSelect(color.class)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-8 h-8 rounded-full border-2 transition-all ${color.class} ${
              selectedColor === color.class
                ? 'border-gray-600 shadow-md'
                : 'border-gray-300 hover:border-gray-500'
            }`}
            style={color.hex ? { backgroundColor: color.hex } : {}}
          />
          {customColors.some(c => c.class === color.class) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCustomColorDelete(color.class);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="w-2 h-2" />
            </button>
          )}
        </div>
      ))}
      
      {customColors.length < 5 && (
        <div className="relative">
          {isPickingColor ? (
            <div className="flex items-center gap-2">
              <input
                type="color"
                onChange={(e) => handleCustomColorAdd(e.target.value)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                autoFocus
              />
              <button
                onClick={() => setIsPickingColor(false)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <motion.button
              onClick={() => setIsPickingColor(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 hover:border-gray-600 transition-all flex items-center justify-center bg-gray-50 hover:bg-gray-100"
            >
              <Plus className="w-4 h-4 text-gray-600" />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
