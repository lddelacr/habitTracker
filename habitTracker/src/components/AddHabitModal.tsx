import React, { useState, useEffect } from 'react';
import { X, Plus, Palette, Calendar, Settings } from 'lucide-react';
import { Habit, HABIT_COLORS } from '../types/habit';
import { getAllCategories, getCategoryColor, getHabitColor } from '../utils/categoryUtils';
import { CategoryCustomizationModal } from './CategoryCustomizationModal';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'completions' | 'currentStreak' | 'bestStreak' | 'createdDate'> & { color: string; selectedDays: string[] }) => void;
  onUpdate?: (id: string, updates: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  editingHabit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('health');
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
  const [isDailySelected, setIsDailySelected] = useState(true);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('#FF6B6B');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const categories = getAllCategories();

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name);
      setDescription(editingHabit.description);
      setCategory(editingHabit.category);
      
      // Handle selectedDays - provide fallback for old habits
      const habitDays = editingHabit.selectedDays || 
        ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      setSelectedDays(habitDays);
      setIsDailySelected(habitDays.length === 7);
      
      // Check if the habit uses a custom color or category color
      if (editingHabit.customColor) {
        setUseCustomColor(true);
        setCustomColor(editingHabit.customColor);
      } else {
        setUseCustomColor(false);
      }
    } else {
      setName('');
      setDescription('');
      setCategory('health');
      setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
      setIsDailySelected(true);
      setUseCustomColor(false);
      setCustomColor('#FF6B6B');
    }
  }, [editingHabit, isOpen]);

  const handleDailyToggle = (checked: boolean) => {
    setIsDailySelected(checked);
    if (checked) {
      setSelectedDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
    } else {
      setSelectedDays([]);
    }
  };

  const handleDayToggle = (day: string) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    
    setSelectedDays(newSelectedDays);
    setIsDailySelected(newSelectedDays.length === 7);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedDays.length === 0) {
      alert('Please enter a habit name and select at least one day.');
      return;
    }

    // Determine final color and custom color flag
    const finalColor = useCustomColor ? customColor : getCategoryColor(category);
    const finalCustomColor = useCustomColor ? customColor : null;
    
    console.log('Submitting habit with category:', category);

    const habitData = {
      name: name.trim(),
      description: description.trim(),
      category,
      selectedDays,
      color: finalColor,
      customColor: finalCustomColor
    };

    console.log('Habit data being submitted:', habitData);

    if (editingHabit && onUpdate) {
      onUpdate(editingHabit.id, habitData);
    } else {
      onAdd(habitData);
    }

    onClose();
  };

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
  };

  const getCurrentColor = () => {
    return useCustomColor ? customColor : getCategoryColor(category);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingHabit ? 'Edit Habit' : 'Add New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="habit-name" className="block text-sm font-medium text-gray-700 mb-2">
              Habit Name *
            </label>
            <input
              id="habit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Drink 8 glasses of water"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="habit-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <div className="description-input-container">
            <textarea
              id="habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any notes or details about this habit..."
              maxLength={50}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
              <div className="character-counter">
                <span className={`char-count ${
                  description.length >= 45 ? 'danger' : 
                  description.length >= 35 ? 'warning' : ''
                }`}>
                  {description.length}
                </span>
                /<span className="char-limit">50</span> characters
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="habit-category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="category-select-container">
              <select
                id="habit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="customize-categories-btn"
                title="Customize category colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-300 ml-auto"
                  style={{ backgroundColor: getCurrentColor() }}
                />
              </div>
            </label>
            
            {/* Color Options */}
            <div className="color-options">
              <div 
                className={`color-option ${!useCustomColor ? 'active' : ''}`}
                onClick={() => setUseCustomColor(false)}
              >
                <div 
                  className="color-preview"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                <div className="color-option-content">
                  <span className="color-option-title">Use Category Color</span>
                  <span className="color-option-subtitle">
                    {categories.find(c => c.id === category)?.name} default
                  </span>
                </div>
                <input
                  type="radio"
                  checked={!useCustomColor}
                  onChange={() => setUseCustomColor(false)}
                  className="color-option-radio"
                />
              </div>
              
              <div 
                className={`color-option ${useCustomColor ? 'active' : ''}`}
                onClick={() => setUseCustomColor(true)}
              >
                <div 
                  className="color-preview"
                  style={{ backgroundColor: customColor }}
                />
                <div className="color-option-content">
                  <span className="color-option-title">Custom Color</span>
                  <span className="color-option-subtitle">Choose your own</span>
                </div>
                <input
                  type="radio"
                  checked={useCustomColor}
                  onChange={() => setUseCustomColor(true)}
                  className="color-option-radio"
                />
              </div>
            </div>

            {/* Custom Color Picker */}
            {useCustomColor && (
              <div className="custom-color-section">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="custom-color-picker"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#FF6B6B"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="custom-color-input"
                />
              </div>
            )}
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                When do you want to do this habit?
              </div>
            </label>
            
            {/* Daily Option */}
            <div className="daily-option mb-4">
              <label className="daily-checkbox">
                <input
                  type="checkbox"
                  checked={isDailySelected}
                  onChange={(e) => handleDailyToggle(e.target.checked)}
                  className="mr-3 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">Daily (Every day)</span>
              </label>
            </div>
            
            {/* Custom Days Section */}
            <div className="custom-days-section">
              <label className="block text-sm font-medium text-gray-600 mb-3">
                Or select specific days:
              </label>
              <div className="days-grid">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.value} className="day-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="day-input sr-only"
                    />
                    <div className={`day-label ${selectedDays.includes(day.value) ? 'selected' : ''}`}>
                      <span className="day-short">{day.short}</span>
                      <span className="day-full">{day.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Validation Message */}
            {selectedDays.length === 0 && (
              <p className="text-red-500 text-sm mt-2">Please select at least one day.</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {editingHabit ? 'Update' : 'Add'} Habit
            </button>
          </div>
        </form>
      </div>

      {/* Category Customization Modal */}
      <CategoryCustomizationModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={() => {
          // Force re-render to show updated category colors
          setCategory(category);
        }}
      />
      
      {/* Custom Styles */}
      <style jsx>{`
        .category-select-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .category-select {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .customize-categories-btn {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .customize-categories-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          color: #374151;
        }

        .color-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .color-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .color-option:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .color-option.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .color-preview {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 2px solid #e5e7eb;
          flex-shrink: 0;
        }

        .color-option-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .color-option-title {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
        }

        .color-option-subtitle {
          font-size: 12px;
          color: #6b7280;
        }

        .color-option-radio {
          width: 16px;
          height: 16px;
          accent-color: #3b82f6;
        }

        .custom-color-section {
          margin-top: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .custom-color-picker {
          width: 60px;
          height: 40px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .custom-color-picker:hover {
          border-color: #3b82f6;
        }

        .custom-color-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .custom-color-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .daily-option {
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .daily-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
        }

        .day-checkbox {
          cursor: pointer;
        }

        .day-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          transition: all 0.2s ease;
          background: white;
          min-height: 60px;
          justify-content: center;
        }

        .day-label:hover {
          background: #f5f5f5;
          border-color: #c0c0c0;
        }

        .day-label.selected {
          background: #e3f2fd;
          border-color: #1976d2;
          color: #1976d2;
        }

        .day-short {
          font-weight: 600;
          font-size: 14px;
          line-height: 1;
        }

        .day-full {
          font-size: 11px;
          margin-top: 2px;
          opacity: 0.8;
        }

        .day-label.selected .day-short,
        .day-label.selected .day-full {
          color: #1976d2;
        }

        /* Character Counter Styling */
        .description-input-container {
          position: relative;
        }

        .character-counter {
          display: flex;
          justify-content: flex-end;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          padding: 0 4px;
        }

        .char-count {
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .char-count.warning {
          color: #f59e0b;
        }

        .char-count.danger {
          color: #ef4444;
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .days-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
          }
          
          .day-label {
            padding: 8px 4px;
            min-height: 50px;
          }
          
          .day-short {
            font-size: 12px;
          }
          
          .day-full {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};