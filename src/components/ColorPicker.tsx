
import React from 'react';
import { motion } from 'framer-motion';

const colors = [
  { name: 'yellow', class: 'bg-yellow-200' },
  { name: 'pink', class: 'bg-pink-200' },
  { name: 'blue', class: 'bg-blue-200' },
  { name: 'green', class: 'bg-green-200' },
  { name: 'purple', class: 'bg-purple-200' },
  { name: 'orange', class: 'bg-orange-200' },
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorSelect }) => {
  return (
    <div className="flex gap-2 p-2 bg-white rounded-lg shadow-md border">
      {colors.map((color) => (
        <motion.button
          key={color.name}
          onClick={() => onColorSelect(color.class)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`w-8 h-8 rounded-full border-2 transition-all ${color.class} ${
            selectedColor === color.class
              ? 'border-gray-600 shadow-md'
              : 'border-gray-300 hover:border-gray-500'
          }`}
        />
      ))}
    </div>
  );
};

export default ColorPicker;
