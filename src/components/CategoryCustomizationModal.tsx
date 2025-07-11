import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Save, Palette } from 'lucide-react';
import { getAllCategories, setCategoryColor, resetCategoryColors } from '../utils/categoryUtils';
import { HabitCategory } from '../types/habit';

interface CategoryCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CategoryCustomizationModal: React.FC<CategoryCustomizationModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategories(getAllCategories());
      setHasChanges(false);
    }
  }, [isOpen]);

  const handleColorChange = (categoryId: string, newColor: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, color: newColor } : cat
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    categories.forEach(category => {
      setCategoryColor(category.id, category.color);
    });
    setHasChanges(false);
    onSave();
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset all category colors to defaults? This cannot be undone.')) {
      resetCategoryColors();
      setCategories(getAllCategories());
      setHasChanges(true);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Customize Categories</h2>
              <p className="text-sm text-gray-500">Set default colors for each habit category</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-sm">
              Customize the colors for each category. These colors will be used as defaults for new habits in each category.
              Existing habits with custom colors will not be affected.
            </p>
          </div>

          <div className="space-y-4">
            {categories.map(category => (
              <div key={category.id} className="category-customization-item">
                <div className="category-info">
                  <div
                    className="category-color-display"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="category-details">
                    <h4>{category.name}</h4>
                    <p>{category.description}</p>
                  </div>
                </div>
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => handleColorChange(category.id, e.target.value)}
                  className="category-color-picker"
                  title={`Change color for ${category.name}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .category-customization-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fafafa;
          transition: all 0.2s ease;
        }

        .category-customization-item:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .category-color-display {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          flex-shrink: 0;
        }

        .category-details h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .category-details p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }

        .category-color-picker {
          width: 40px;
          height: 40px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-color-picker:hover {
          border-color: #3b82f6;
          transform: scale(1.05);
        }

        .category-color-picker:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
};