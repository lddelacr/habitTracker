import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar, Palette, ChevronDown, Settings } from 'lucide-react';
import { Task } from '../types/task';
import { getAllCategories, getCategoryColor } from '../utils/categoryUtils';
import { getTodayString } from '../utils/dateUtils';
import { CategoryCustomizationModal } from './CategoryCustomizationModal';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdDate'>) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  editingTask?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  editingTask
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('work');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [dueTime, setDueTime] = useState('09:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [timeInputValue, setTimeInputValue] = useState('9:00 AM');
  const [timeError, setTimeError] = useState('');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const timeInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = getAllCategories();

  // Generate time options in 15-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const period = hour < 12 ? 'am' : 'pm';
        const timeDisplay = `${hour12}:${minute.toString().padStart(2, '0')}${period}`;
        options.push({ value: time24, display: timeDisplay });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Convert 24-hour time to 12-hour display format
  const formatTimeDisplay = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Parse various time input formats
  const parseTimeInput = (input: string): string | null => {
    const cleanInput = input.trim().toLowerCase().replace(/\s+/g, '');
    
    // Try different patterns
    const patterns = [
      // 12-hour formats
      /^(\d{1,2}):(\d{2})\s*(am|pm|a|p)$/,
      /^(\d{1,2}):(\d{2})\s*(am|pm)$/,
      /^(\d{1,2})\s*(am|pm|a|p)$/,
      /^(\d{1,2})(\d{2})\s*(am|pm|a|p)$/,
      // 24-hour formats
      /^(\d{1,2}):(\d{2})$/,
      /^(\d{3,4})$/
    ];

    for (const pattern of patterns) {
      const match = cleanInput.match(pattern);
      if (match) {
        let hours: number;
        let minutes: number;
        
        if (pattern.source.includes('am|pm')) {
          // 12-hour format
          hours = parseInt(match[1]);
          minutes = match[2] ? parseInt(match[2]) : 0;
          const period = match[3] || match[2];
          
          if (hours < 1 || hours > 12) continue;
          if (minutes > 59) continue;
          
          if (period.startsWith('p') && hours !== 12) hours += 12;
          if (period.startsWith('a') && hours === 12) hours = 0;
        } else if (match[2]) {
          // 24-hour format with colon
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
        } else {
          // 24-hour format without colon (e.g., "1430")
          const timeStr = match[1].padStart(4, '0');
          hours = parseInt(timeStr.substring(0, 2));
          minutes = parseInt(timeStr.substring(2, 4));
        }
        
        if (hours > 23 || minutes > 59) continue;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  };

  // Handle time input change
  const handleTimeInputChange = (value: string) => {
    setTimeInputValue(value);
    setTimeError('');
    
    if (value.trim() === '') {
      setTimeError('Time is required');
      return;
    }
    
    const parsedTime = parseTimeInput(value);
    if (parsedTime) {
      setDueTime(parsedTime);
    } else {
      setTimeError('Invalid time format');
    }
  };

  // Handle time input blur (auto-format)
  const handleTimeInputBlur = () => {
    if (timeError === '' && dueTime) {
      setTimeInputValue(formatTimeDisplay(dueTime));
    }
  };

  // Handle dropdown option click
  const handleTimeOptionClick = (time24: string) => {
    setDueTime(time24);
    setTimeInputValue(formatTimeDisplay(time24));
    setTimeError('');
    setShowTimeDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setDescription(editingTask.description);
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime);
      setIsAllDay(editingTask.dueTime === '00:00');
      setTimeInputValue(editingTask.dueTime === '00:00' ? '12:00 AM' : formatTimeDisplay(editingTask.dueTime));
      
      if (editingTask.customColor) {
        setUseCustomColor(true);
        setCustomColor(editingTask.customColor);
      } else {
        setUseCustomColor(false);
      }
    } else {
      setName('');
      setDescription('');
      setCategory('work');
      setDueDate(getTodayString());
      setDueTime('09:00');
      setIsAllDay(false);
      setTimeInputValue('9:00 AM');
      setUseCustomColor(false);
      setCustomColor('#3b82f6');
    }
    setTimeError('');
  }, [editingTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a task name.');
      return;
    }

    if (!isAllDay && timeError) {
      alert('Please enter a valid time.');
      return;
    }

    const finalColor = useCustomColor ? customColor : getCategoryColor(category);
    const finalCustomColor = useCustomColor ? customColor : null;
    const finalTime = isAllDay ? '00:00' : dueTime;
    
    console.log('Submitting task with category:', category);

    if (editingTask && onUpdate) {
      // FIXED: When editing, only include the fields that can be changed
      // DO NOT include status - let it preserve the existing status
      const taskData = {
        name: name.trim(),
        description: description.trim(),
        category,
        dueDate,
        dueTime: finalTime,
        color: finalColor,
        customColor: finalCustomColor
      };

      console.log('Task update data being submitted:', taskData);
      onUpdate(editingTask.id, taskData);
    } else {
      // For new tasks, include all fields including initial status
      const taskData = {
        name: name.trim(),
        description: description.trim(),
        category,
        dueDate,
        dueTime: finalTime,
        status: 'pending' as const,
        color: finalColor,
        customColor: finalCustomColor
      };

      console.log('New task data being submitted:', taskData);
      onAdd(taskData);
    }

    onClose();
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
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Task Name */}
          <div>
            <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-2">
              Task Name *
            </label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Complete project proposal"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 2. Due Date & Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date & Time *
              </div>
            </label>
            
            {/* Date and All Day Row */}
            <div className="google-datetime-row">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="google-date-input"
                required
              />
              
              <label className="google-allday-checkbox">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="google-checkbox"
                />
                <span className="google-checkbox-label">All day</span>
              </label>
            </div>
            
            {/* Time Input (Google Calendar Style) */}
            {!isAllDay && (
              <div className="google-time-container" ref={dropdownRef}>
                <div className="google-time-input-wrapper">
                  <input
                    ref={timeInputRef}
                    type="text"
                    value={timeInputValue}
                    onChange={(e) => handleTimeInputChange(e.target.value)}
                    onBlur={handleTimeInputBlur}
                    onFocus={() => setShowTimeDropdown(false)}
                    placeholder="12:00 am"
                    className={`google-time-input ${timeError ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                    className="google-time-dropdown-btn"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                {timeError && (
                  <div className="google-time-error">{timeError}</div>
                )}
                
                {/* Time Dropdown */}
                {showTimeDropdown && (
                  <div className="google-time-dropdown">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTimeOptionClick(option.value)}
                        className="google-time-option"
                      >
                        {option.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Description */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <div className="description-input-container">
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any notes or details about this task..."
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

          {/* 4. Category */}
          <div>
            <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="category-select-container">
              <select
                id="task-category"
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

          {/* 5. Color Selection */}
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

            {useCustomColor && (
              <div className="custom-color-section">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="custom-color-picker"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#3b82f6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="custom-color-input"
                />
              </div>
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
              {editingTask ? 'Update' : 'Add'} Task
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

      {/* Google Calendar Style CSS */}
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

        /* Google Calendar Style Date & Time */
        .google-datetime-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }

        .google-date-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-size: 14px;
          color: #3c4043;
          background: #fff;
          transition: all 0.2s ease;
        }

        .google-date-input:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 1px #1a73e8;
        }

        .google-allday-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .google-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #1a73e8;
          cursor: pointer;
        }

        .google-checkbox-label {
          font-size: 14px;
          color: #3c4043;
          font-weight: 400;
        }

        .google-time-container {
          position: relative;
          margin-bottom: 12px;
        }

        .google-time-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .google-time-input {
          flex: 1;
          padding: 8px 12px;
          padding-right: 40px;
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-size: 14px;
          color: #3c4043;
          background: #fff;
          transition: all 0.2s ease;
          width: 140px;
        }

        .google-time-input:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 1px #1a73e8;
        }

        .google-time-input.error {
          border-color: #ea4335;
          box-shadow: 0 0 0 1px #ea4335;
        }

        .google-time-dropdown-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #5f6368;
          cursor: pointer;
          padding: 4px;
          border-radius: 2px;
          transition: all 0.2s ease;
        }

        .google-time-dropdown-btn:hover {
          background: #f1f3f4;
          color: #3c4043;
        }

        .google-time-error {
          color: #ea4335;
          font-size: 12px;
          margin-top: 4px;
          margin-left: 12px;
        }

        .google-time-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border: 1px solid #dadce0;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          margin-top: 4px;
        }

        .google-time-option {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          font-size: 14px;
          color: #3c4043;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .google-time-option:hover {
          background: #f1f3f4;
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

        @media (max-width: 640px) {
          .google-datetime-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .google-date-input {
            width: 100%;
          }
          
          .google-time-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};