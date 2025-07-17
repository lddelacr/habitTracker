import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Calendar, Settings, CheckSquare, MapPin} from 'lucide-react';
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
  // NEW: Task/Event toggle
  const [itemType, setItemType] = useState<'task' | 'event'>('task');
  
  // Existing fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('work');
  const [dueDate, setDueDate] = useState(getTodayString());
  const [dueTime, setDueTime] = useState('09:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [timeInputValue, setTimeInputValue] = useState('9:00am');
  const [timeError, setTimeError] = useState('');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // NEW: Event-specific fields (removed attendees)
  const [endTime, setEndTime] = useState('10:00');
  const [endTimeInputValue, setEndTimeInputValue] = useState('10:00am');
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(false);
  const [location, setLocation] = useState('');
  
  const timeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const endDropdownRef = useRef<HTMLDivElement>(null);

  const categories = getAllCategories();

  // Generate time options in 15-minute intervals (your original system)
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
    const period = hours < 12 ? 'am' : 'pm';
    return `${hour12}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Your original time parsing logic (FIXED)
  const parseTimeInput = (input: string): string | null => {
    const cleanInput = input.toLowerCase().trim();
    
    // Pattern 1: 12:30am, 12:30 am
    const pattern1 = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(cleanInput);
    if (pattern1) {
      let hours = parseInt(pattern1[1]);
      const minutes = parseInt(pattern1[2]);
      const period = pattern1[3].toLowerCase();
      
      if (hours < 1 || hours > 12 || minutes > 59) return null;
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Pattern 2: 9am, 9 am (no minutes specified)
    const pattern2 = /^(\d{1,2})\s*(am|pm)$/i.exec(cleanInput);
    if (pattern2) {
      let hours = parseInt(pattern2[1]);
      const period = pattern2[2].toLowerCase();
      const minutes = 0; // Default to :00
      
      if (hours < 1 || hours > 12) return null;
      
      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Pattern 3: 24-hour format with colon (14:30)
    const pattern3 = /^(\d{1,2}):(\d{2})$/.exec(cleanInput);
    if (pattern3) {
      const hours = parseInt(pattern3[1]);
      const minutes = parseInt(pattern3[2]);
      
      if (hours > 23 || minutes > 59) return null;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Pattern 4: 24-hour format without colon (1430, 930)
    const pattern4 = /^(\d{3,4})$/.exec(cleanInput);
    if (pattern4) {
      const timeStr = pattern4[1].padStart(4, '0');
      const hours = parseInt(timeStr.substring(0, 2));
      const minutes = parseInt(timeStr.substring(2, 4));
      
      if (hours > 23 || minutes > 59) return null;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return null;
  };

  // Handle time input change (your original system)
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

  // Handle end time input change
  const handleEndTimeInputChange = (value: string) => {
    setEndTimeInputValue(value);
    setTimeError('');
    
    const parsedTime = parseTimeInput(value);
    if (parsedTime) {
      setEndTime(parsedTime);
    } else {
      setTimeError('Invalid time format');
    }
  };

  // Handle time input blur (auto-format and close dropdown)
  const handleTimeInputBlur = () => {
    if (timeError === '' && dueTime) {
      setTimeInputValue(formatTimeDisplay(dueTime));
    }
    // Close dropdown after a delay to allow for option selection
    setTimeout(() => setShowTimeDropdown(false), 150);
  };

  const handleEndTimeInputBlur = () => {
    if (timeError === '' && endTime) {
      setEndTimeInputValue(formatTimeDisplay(endTime));
    }
    // Close dropdown after a delay to allow for option selection
    setTimeout(() => setShowEndTimeDropdown(false), 150);
  };

  // Handle dropdown option click
  const handleTimeOptionClick = (time24: string) => {
    setDueTime(time24);
    setTimeInputValue(formatTimeDisplay(time24));
    setTimeError('');
    setShowTimeDropdown(false);
  };

  const handleEndTimeOptionClick = (time24: string) => {
    setEndTime(time24);
    setEndTimeInputValue(formatTimeDisplay(time24));
    setTimeError('');
    setShowEndTimeDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
      if (endDropdownRef.current && !endDropdownRef.current.contains(event.target as Node)) {
        setShowEndTimeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && editingTask) {
      setItemType(editingTask.type || 'task');
      setName(editingTask.name);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime);
      setEndTime(editingTask.endTime || '10:00');
      setLocation(editingTask.location || '');
      setIsAllDay(editingTask.dueTime === '00:00');
      setTimeInputValue(editingTask.dueTime === '00:00' ? '12:00am' : formatTimeDisplay(editingTask.dueTime));
      setEndTimeInputValue(formatTimeDisplay(editingTask.endTime || '10:00'));
      
      if (editingTask.customColor) {
        setUseCustomColor(true);
        setCustomColor(editingTask.customColor);
      } else {
        setUseCustomColor(false);
      }
    } else if (isOpen) {
      setItemType('task');
      setName('');
      setDescription('');
      setCategory('work');
      setDueDate(getTodayString());
      setDueTime('09:00');
      setEndTime('10:00');
      setLocation('');
      setIsAllDay(false);
      setTimeInputValue('9:00am');
      setEndTimeInputValue('10:00am');
      setUseCustomColor(false);
      setCustomColor('#3b82f6');
    }
    setTimeError('');
  }, [editingTask, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a name.');
      return;
    }

    if (!isAllDay && timeError) {
      alert('Please enter valid times.');
      return;
    }

    const finalColor = useCustomColor ? customColor : getCategoryColor(category);
    const finalCustomColor = useCustomColor ? customColor : null;
    const finalDueTime = isAllDay ? '00:00' : dueTime;
    const finalEndTime = isAllDay ? '00:00' : endTime;

    const baseData = {
      name: name.trim(),
      description: description.trim(),
      category,
      dueDate,
      dueTime: finalDueTime,
      color: finalColor,
      customColor: finalCustomColor,
      type: itemType,
      // Event-specific fields
      ...(itemType === 'event' && {
        endTime: finalEndTime,
        location: location.trim() || undefined,
      }),
    };

    if (editingTask && onUpdate) {
      onUpdate(editingTask.id, baseData);
    } else {
      onAdd({
        ...baseData,
        status: 'pending' as const,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header with Task/Event Toggle */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {/* Google Calendar-style Type Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setItemType('task')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    itemType === 'task'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4" />
                    Task
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('event')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    itemType === 'event'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Event
                  </div>
                </button>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800">
                {editingTask ? `Edit ${itemType}` : `Add ${itemType}`}
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="item-name" className="block text-sm font-medium text-gray-700 mb-2">
                {itemType === 'task' ? 'Task' : 'Event'} Name *
              </label>
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={itemType === 'task' ? 'e.g., Complete project proposal' : 'e.g., Team meeting'}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Date & Time Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {itemType === 'task' ? 'Due Date & Time' : 'Date & Time'} *
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
              
              {/* Time Inputs */}
              {!isAllDay && (
                <div className="flex items-center gap-3">
                  {/* Start Time */}
                  <div className="flex-1">
                    <div className="google-time-container" ref={dropdownRef}>
                      <div className="google-time-input-wrapper">
                        <input
                          ref={timeInputRef}
                          type="text"
                          value={timeInputValue}
                          onChange={(e) => handleTimeInputChange(e.target.value)}
                          onBlur={handleTimeInputBlur}
                          onFocus={() => setShowTimeDropdown(true)}
                          onClick={() => setShowTimeDropdown(true)}
                          placeholder="12:00am"
                          className={`google-time-input ${timeError ? 'error' : ''}`}
                        />
                      </div>
                      
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
                  </div>
                  
                  {/* End Time (Events only) */}
                  {itemType === 'event' && (
                    <>
                      <span className="text-gray-500 text-sm">to</span>
                      <div className="flex-1">
                        <div className="google-time-container" ref={endDropdownRef}>
                          <div className="google-time-input-wrapper">
                            <input
                              ref={endTimeInputRef}
                              type="text"
                              value={endTimeInputValue}
                              onChange={(e) => handleEndTimeInputChange(e.target.value)}
                              onBlur={handleEndTimeInputBlur}
                              onFocus={() => setShowEndTimeDropdown(true)}
                              onClick={() => setShowEndTimeDropdown(true)}
                              placeholder="12:00am"
                              className={`google-time-input ${timeError ? 'error' : ''}`}
                            />
                          </div>
                          
                          {/* End Time Dropdown */}
                          {showEndTimeDropdown && (
                            <div className="google-time-dropdown">
                              {timeOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleEndTimeOptionClick(option.value)}
                                  className="google-time-option"
                                >
                                  {option.display}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {timeError && (
                <div className="google-time-error">{timeError}</div>
              )}
            </div>

            {/* Event-specific: Location */}
            {itemType === 'event' && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Conference Room A, Zoom, Corner Bistro"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <div className="description-input-container">
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={itemType === 'task' ? 'Add any notes or details about this task...' : 'Add any notes or details about this event...'}
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

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Customize
                </button>
              </div>
              
              {/* Category Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`category-option ${category === cat.id ? 'active' : ''}`}
                  >
                    <div 
                      className="color-preview"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="category-option-content">
                      <span className="category-option-title">{cat.name}</span>
                    </div>
                    <input
                      type="radio"
                      checked={category === cat.id}
                      onChange={() => setCategory(cat.id)}
                      className="category-option-radio"
                    />
                  </div>
                ))}
              </div>

              {/* Custom Color Override */}
              <div className="custom-color-override">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomColor}
                    onChange={(e) => setUseCustomColor(e.target.checked)}
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Use custom color for this {itemType}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Override the default category color for this {itemType} only
                </p>
                <p className="text-xs text-blue-600 mt-2 ml-7">
                  To customize the default color for the category, click the "Customize" button above
                </p>
              </div>

              {useCustomColor && (
                <div className="custom-color-section">
                  <div className="flex items-center gap-3">
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
                </div>
              )}
            </div>

            {/* Form Actions */}
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
                {editingTask ? `Update ${itemType}` : `Add ${itemType}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Customization Modal */}
      <CategoryCustomizationModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={() => setIsCategoryModalOpen(false)}
      />

      {/* Google Calendar Style CSS */}
      <style jsx>{`
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
          border: 1px solid #dadce0;
          border-radius: 4px;
          font-size: 14px;
          color: #3c4043;
          background: #fff;
          transition: all 0.2s ease;
          width: 140px;
          cursor: pointer;
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
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .category-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .category-option:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }

        .category-option.active {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .color-preview {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          flex-shrink: 0;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .category-option-content {
          flex: 1;
        }

        .category-option-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .category-option-radio {
          width: 16px;
          height: 16px;
          accent-color: #3b82f6;
        }

        .custom-color-override {
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .custom-color-override .text-blue-600 {
          background: #eff6ff;
          padding: 6px 8px;
          border-radius: 4px;
          border-left: 3px solid #3b82f6;
          margin-left: 28px !important;
          margin-top: 8px;
        }

        .custom-color-section {
          margin-top: 16px;
          padding: 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .custom-color-picker {
          width: 50px;
          height: 35px;
          border: 1px solid #d1d5db;
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
    </>
  );
};