import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, X, CheckCircle, Circle } from 'lucide-react';
import { Habit } from '../types/habit';
import { 
  getCalendarDays, 
  isSameMonth, 
  isSameDay, 
  getMonthName, 
  formatDate,
  getTodayString 
} from '../utils/dateUtils';

interface CalendarViewProps {
  habits: Habit[];
  onToggleCompletion?: (id: string) => void;
  onToggleCompletionForDate?: (id: string, date: string) => void;
  getHabitNote?: (habitId: string, date: string) => string;
  saveHabitNote?: (habitId: string, date: string, note: string) => void;
  getDailyThoughts?: (date: string) => string;
  saveDailyThoughts?: (date: string, thoughts: string) => void;
}

// Utility function to determine if text should be white or black based on background color
const getTextColor = (backgroundColor: string): string => {
  if (!backgroundColor || typeof backgroundColor !== 'string') {
    return '#000000';
  }
  
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  if (!hex || typeof hex !== 'string') {
    hex = '#6b7280';
  }
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Parse date string to create proper Date object for modal display
const parseModalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Calculate required rows for a given month
const getRequiredRows = (year: number, month: number): number => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = firstDay + daysInMonth;
  return Math.ceil(totalCells / 7);
};

// Get habits that are scheduled for a specific day of the week
const getHabitsForDay = (date: Date, allHabits: Habit[]): Habit[] => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const clickedDayName = dayNames[dayOfWeek];
  const dateString = formatDate(date);
  
  return allHabits.filter(habit => {
    // CRITICAL: Only show habits that were created before or on this date
    // Parse habit creation date properly (YYYY-MM-DD format)
    const habitCreatedDateString = habit.createdDate;
    if (habitCreatedDateString > dateString) {
      return false;
    }
    
    // Check if habit is scheduled for this day
    if (habit.selectedDays && habit.selectedDays.includes(clickedDayName)) {
      return true;
    }
    
    // Handle legacy habits without selectedDays (assume daily)
    if (!habit.selectedDays || habit.selectedDays.length === 0) {
      return true;
    }
    
    return false;
  });
};

// FIXED: Check if a habit should be visible on a specific date (creation date validation)
const isHabitVisibleOnDate = (habit: Habit, dateString: string): boolean => {
  // Habit must have been created on or before this date
  if (habit.createdDate > dateString) {
    return false;
  }
  
  // Parse the date to check day of week
  const date = new Date(dateString + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  // Check if habit is scheduled for this day
  return habit.selectedDays && habit.selectedDays.includes(dayName);
};

// Check if a habit is completed on a specific date
const isHabitCompletedOnDate = (habit: Habit, dateString: string): boolean => {
  return habit.completions.includes(dateString);
};

// Day Details Modal Component
const DayDetailsModal: React.FC<{
  selectedDay: string;
  habits: Habit[];
  onClose: () => void;
  onToggleCompletion?: (id: string) => void;
  onToggleCompletionForDate?: (id: string, date: string) => void;
  getHabitNote?: (habitId: string, date: string) => string;
  saveHabitNote?: (habitId: string, date: string, note: string) => void;
  getDailyThoughts?: (date: string) => string;
  saveDailyThoughts?: (date: string, thoughts: string) => void;
}> = ({ 
  selectedDay, 
  habits, 
  onClose, 
  onToggleCompletion,
  onToggleCompletionForDate,
  getHabitNote,
  saveHabitNote,
  getDailyThoughts,
  saveDailyThoughts
}) => {
  const [editingNoteHabit, setEditingNoteHabit] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [editingThoughts, setEditingThoughts] = useState(false);
  const [thoughtsText, setThoughtsText] = useState('');

  // FIXED: Get habits that are actually scheduled for this day of the week AND existed on this date
  const selectedDate = parseModalDate(selectedDay);
  const relevantHabits = habits.filter(habit => isHabitVisibleOnDate(habit, selectedDay));
  const completedHabits = relevantHabits.filter(habit => isHabitCompletedOnDate(habit, selectedDay));
  
  const currentThoughts = getDailyThoughts ? getDailyThoughts(selectedDay) : '';
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditNote = (habitId: string) => {
    setEditingNoteHabit(habitId);
    const existingNote = getHabitNote ? getHabitNote(habitId, selectedDay) : '';
    setNoteText(existingNote);
  };

  const handleSaveNote = (habitId: string) => {
    if (saveHabitNote) {
      saveHabitNote(habitId, selectedDay, noteText);
    }
    setEditingNoteHabit(null);
    setNoteText('');
  };

  const handleCancelNote = () => {
    setEditingNoteHabit(null);
    setNoteText('');
  };

  const handleEditThoughts = () => {
    setEditingThoughts(true);
    setThoughtsText(currentThoughts);
  };

  const handleSaveThoughts = () => {
    if (saveDailyThoughts) {
      saveDailyThoughts(selectedDay, thoughtsText);
    }
    setEditingThoughts(false);
  };

  const handleCancelThoughts = () => {
    setEditingThoughts(false);
    setThoughtsText('');
  };

  const getHabitNoteText = (habitId: string) => {
    return getHabitNote ? getHabitNote(habitId, selectedDay) : '';
  };
  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        {/* Modal Content */}
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {parseModalDate(selectedDay).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {completedHabits.length} of {relevantHabits.length} habits completed
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Daily Thoughts Section - MOVED TO TOP */}
            <div className="daily-thoughts-section mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Daily Thoughts</h4>
              {editingThoughts ? (
                <div className="thoughts-edit-container">
                  <textarea
                    value={thoughtsText}
                    onChange={(e) => setThoughtsText(e.target.value)}
                    placeholder="Reflect on this day..."
                    className="thoughts-edit-input"
                    autoFocus
                  />
                  <div className="thoughts-edit-actions">
                    <button
                      onClick={handleSaveThoughts}
                      className="save-thoughts-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelThoughts}
                      className="cancel-thoughts-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`thoughts-display ${currentThoughts ? '' : 'empty'}`}>
                  {currentThoughts ? (
                    <>
                      <div className="thoughts-text">{currentThoughts}</div>
                      <button
                        onClick={handleEditThoughts}
                        className="edit-thoughts-btn"
                      >
                        Edit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditThoughts}
                      className="add-thoughts-btn"
                    >
                      Add Daily Thoughts
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Habits Section - MOVED TO BOTTOM */}
            <div className="habits-section">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Habits</h4>
            {relevantHabits.length > 0 ? (
              <div className="space-y-4">
                {relevantHabits.map(habit => {
                  // FIXED: Only show completion if habit existed on this date
                  const isCompleted = selectedDay >= habit.createdDate && isHabitCompletedOnDate(habit, selectedDay);
                  const habitNote = getHabitNoteText(habit.id);
                  const isEditingNote = editingNoteHabit === habit.id;
                  
                  return (
                    <div
                      key={habit.id}
                      className="modal-habit-item"
                      style={{ '--habit-color': habit.color } as React.CSSProperties}
                    >
                      <div className="habit-completion-toggle">
                        {onToggleCompletionForDate ? (
                          <input
                            type="checkbox"
                            id={`modal-habit-${habit.id}`}
                            className="modal-habit-checkbox"
                            checked={isCompleted}
                            onChange={() => {
                              // FIXED: Prevent completion before creation date
                              if (selectedDay >= habit.createdDate) {
                                onToggleCompletionForDate(habit.id, selectedDay);
                              }
                            }}
                            style={{ accentColor: habit.color }}
                            disabled={selectedDay < habit.createdDate}
                          />
                        ) : (
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300" />
                            )}
                          </div>
                        )}
                        <div
                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: habit.color || '#6b7280' }}
                        />
                        <label 
                          htmlFor={`modal-habit-${habit.id}`} 
                          className={`habit-name ${selectedDay < habit.createdDate ? 'opacity-50' : ''}`}
                        >
                          {habit.name}
                          {selectedDay < habit.createdDate && (
                            <span className="text-xs text-gray-400 ml-2">(Not created yet)</span>
                          )}
                        </label>
                      </div>
                      
                      {/* Note Section */}
                      <div className="habit-note-display">
                        {isEditingNote ? (
                          <div className="note-edit-container">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add a note about this habit..."
                              className="note-edit-input"
                              autoFocus
                            />
                            <div className="note-edit-actions">
                              <button
                                onClick={() => handleSaveNote(habit.id)}
                                className="save-note-btn"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelNote}
                                className="cancel-note-btn"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`note-display ${habitNote ? '' : 'empty'}`}>
                            {habitNote ? (
                              <>
                                <div className="note-text">{habitNote}</div>
                                <button
                                  onClick={() => handleEditNote(habit.id)}
                                  className="edit-note-btn"
                                >
                                  Edit
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditNote(habit.id)}
                                className="add-note-btn"
                              >
                                Add Note
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📅</div>
                <p className="text-gray-500">No habits scheduled for this day</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Styles */}
      <style jsx>{`
        .modal-habit-item {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-left: 4px solid var(--habit-color);
          border-radius: 8px;
          background: #ffffff;
        }

        .habit-completion-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .modal-habit-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .habit-name {
          font-weight: 500;
          color: #1f2937;
          cursor: pointer;
          flex: 1;
        }

        .habit-note-display {
          margin-left: 36px;
        }

        .note-display {
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .note-display.empty {
          background: transparent;
          border: 1px dashed #d1d5db;
          text-align: center;
          padding: 16px;
        }

        .note-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.4;
          margin-bottom: 8px;
          white-space: pre-wrap;
        }

        .edit-note-btn, .add-note-btn {
          font-size: 12px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .edit-note-btn:hover, .add-note-btn:hover {
          color: #374151;
        }

        .add-note-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 8px 16px;
          text-decoration: none;
          font-weight: 500;
        }

        .add-note-btn:hover {
          background: #e5e7eb;
        }

        .note-edit-container, .thoughts-edit-container {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }

        .note-edit-input, .thoughts-edit-input {
          width: 100%;
          min-height: 60px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 8px;
        }

        .thoughts-edit-input {
          min-height: 80px;
        }

        .note-edit-input:focus, .thoughts-edit-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .note-edit-actions, .thoughts-edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-note-btn, .cancel-note-btn, .save-thoughts-btn, .cancel-thoughts-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-note-btn, .save-thoughts-btn {
          background: #3b82f6;
          color: white;
        }

        .save-note-btn:hover, .save-thoughts-btn:hover {
          background: #2563eb;
        }

        .cancel-note-btn, .cancel-thoughts-btn {
          background: #e5e7eb;
          color: #374151;
        }

        .cancel-note-btn:hover, .cancel-thoughts-btn:hover {
          background: #d1d5db;
        }

        .thoughts-display {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .thoughts-display.empty {
          background: transparent;
          border: 1px dashed #d1d5db;
          text-align: center;
          padding: 20px;
        }

        .thoughts-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }

        .edit-thoughts-btn, .add-thoughts-btn {
          font-size: 12px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .edit-thoughts-btn:hover, .add-thoughts-btn:hover {
          color: #374151;
        }

        .add-thoughts-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 8px 16px;
          text-decoration: none;
          font-weight: 500;
        }

        .add-thoughts-btn:hover {
          background: #e5e7eb;
        }
      `}</style>
    </>
  );
};

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  habits, 
  onToggleCompletion,
  onToggleCompletionForDate,
  getHabitNote,
  saveHabitNote,
  getDailyThoughts,
  saveDailyThoughts
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = getCalendarDays(year, month);
  const today = new Date();
  const todayString = getTodayString();
  
  // Calculate required rows for current month
  const requiredRows = getRequiredRows(year, month);

  // Listen for habit completion changes to force calendar updates
  useEffect(() => {
    const handleHabitCompletionChange = (event: CustomEvent) => {
      // Force a re-render to update calendar colors
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('habitCompletionChanged', handleHabitCompletionChange as EventListener);
    
    return () => {
      window.removeEventListener('habitCompletionChanged', handleHabitCompletionChange as EventListener);
    };
  }, []);

  // Also force update when habits prop changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [habits]);
  // Fix calendar date positioning - ensure proper alignment with day headers
  const getCalendarDaysForMonth = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOfWeek = new Date(firstDay);
    
    // Adjust to start on Sunday (0) to match our day headers
    const dayOfWeek = firstDay.getDay();
    startOfWeek.setDate(firstDay.getDate() - dayOfWeek);
    
    const days: Date[] = [];
    const currentDate = new Date(startOfWeek);
    
    // Generate exactly the number of days needed for the required rows
    for (let i = 0; i < requiredRows * 7; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getHabitsForDate = (dateString: string) => {
    return habits.filter(habit => habit.completions.includes(dateString));
  };

  const isAllHabitsCompleted = (dateString: string) => {
    const dateObj = new Date(dateString);
    // FIXED: Use consistent filtering logic
    const relevantHabits = habits.filter(habit => isHabitVisibleOnDate(habit, dateString));
    
    if (relevantHabits.length === 0) return false;
    
    // FIXED: Check if ALL relevant habits are completed for this date
    // AND validate that completions are not before creation date
    return relevantHabits.every(habit => {
      // Only count completion if it's after or on creation date
      if (dateString < habit.createdDate) {
        return false; // Habit didn't exist, so can't be completed
      }
      return habit.completions.includes(dateString);
    });
  };

  const getSelectedHabit = () => {
    return habits.find(h => h.id === selectedHabitId);
  };

  const handleDayClick = (day: Date) => {
    const dateString = formatDate(day);
    setSelectedDay(dateString);
  };

  const closeModal = () => {
    setSelectedDay(null);
  };

  const getDayBackgroundStyle = (day: Date) => {
    const dateString = formatDate(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isToday = isSameDay(day, today);
    const selectedHabit = getSelectedHabit();

    // Base styles
    let backgroundColor = 'transparent';
    let textColor = isCurrentMonth ? '#1f2937' : '#9aa0a6';

    if (selectedHabitId === 'all') {
      // All habits view - only show green for perfect days
      const isPerfectDay = isAllHabitsCompleted(dateString);
      if (isPerfectDay) {
        backgroundColor = '#4CAF50'; // Green for perfect day
        textColor = '#ffffff';
      }
    } else if (selectedHabit) {
      // FIXED: Individual habit view - validate habit existed and was scheduled
      const isVisible = isHabitVisibleOnDate(selectedHabit, dateString);
      const isCompleted = isVisible && selectedHabit.completions.includes(dateString);
      if (isCompleted && dateString >= selectedHabit.createdDate) {
        backgroundColor = hexToRgba(selectedHabit.color || '#6b7280', 0.85);
        textColor = getTextColor(selectedHabit.color || '#6b7280');
      }
    }

    return {
      backgroundColor,
      color: textColor,
      '--original-color': backgroundColor !== 'transparent' ? backgroundColor : undefined,
    };
  };

  const renderHabitContent = (day: Date) => {
    const dateString = formatDate(day);
    const selectedHabit = getSelectedHabit();

    // Individual habit view - no additional content needed (background is colored)
    if (selectedHabitId !== 'all' && selectedHabit) {
      return null;
    }

    // All habits view - show bars and perfect day indicators
    if (selectedHabitId === 'all') {
      const isPerfectDay = isAllHabitsCompleted(dateString);
      
      if (isPerfectDay) {
        return (
          <div className="absolute top-6 left-1 right-1 flex items-center justify-center">
            <div className="flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-current" />
            </div>
          </div>
        );
      }

      // FIXED: For partial completion, show nothing (clean neutral appearance)
      return null;
    }

    return null;
  };

  // Use the fixed calendar generation function
  const displayedDays = getCalendarDaysForMonth(year, month);

  return (
    <>
      {/* Global CSS Reset for Calendar Page */}
      <style jsx global>{`
        /* Calendar-specific global styles */
        .calendar-view-container {
          overflow: hidden;
        }
      `}</style>

      <div className="calendar-layout" style={{ '--required-rows': requiredRows } as React.CSSProperties}>
        {/* Ultra-Compact Header - 35px height */}
        <div className="calendar-header">
          <div className="header-content">
            {/* Left: Navigation Arrows */}
            <div className="header-left">
              <button
                onClick={() => navigateMonth('prev')}
                className="nav-arrow"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="nav-arrow"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Month/Year */}
            <div className="header-center">
              <h2 className="month-year">
                {getMonthName(month)} {year}
              </h2>
            </div>

            {/* Right: Controls */}
            <div className="header-right">
              <button onClick={goToToday} className="today-button">
                Today
              </button>
              <select
                value={selectedHabitId}
                onChange={(e) => setSelectedHabitId(e.target.value)}
                className="view-dropdown"
              >
                <option value="all">All Habits</option>
                {habits.map(habit => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Container - Uses remaining viewport */}
        <div className="calendar-main">
          <div className="calendar-grid">
            {/* Minimal Day Headers - 30px height */}
            <div className="day-headers">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="day-header">
                  <span className="day-header-text">
                    {day.slice(0, 3).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Dynamic Calendar Days Grid - Adjusts to required rows */}
            <div className="days-container">
              {displayedDays.map((day, index) => {
                const dateString = formatDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, today);
                const dayStyle = getDayBackgroundStyle(day);
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`day-cell ${
                      isToday ? 'today' : ''
                    } ${
                      !isCurrentMonth ? 'other-month' : ''
                    } ${
                      dayStyle.backgroundColor !== 'transparent' ? 'has-color' : 'empty-day'
                    }`}
                    style={{
                      backgroundColor: dayStyle.backgroundColor !== 'transparent' ? dayStyle.backgroundColor : undefined,
                      color: dayStyle.color,
                      '--original-color': dayStyle['--original-color'],
                    }}
                  >
                    {/* Day Number - Top Center like Google Calendar */}
                    <div className="day-number">
                      <span className="day-number-text">
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Habit Content Area */}
                    <div className="day-content">
                      {renderHabitContent(day)}
                    </div>

                    {/* Hover Effect */}
                    <div className="hover-overlay" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Details Modal */}
        {selectedDay && (
          <DayDetailsModal
            selectedDay={selectedDay}
            habits={habits}
            onClose={closeModal}
            onToggleCompletion={onToggleCompletion}
            onToggleCompletionForDate={onToggleCompletionForDate}
            getHabitNote={getHabitNote}
            saveHabitNote={saveHabitNote}
            getDailyThoughts={getDailyThoughts}
            saveDailyThoughts={saveDailyThoughts}
          />
        )}
      </div>

      {/* CSS Styles - Perfect Viewport Fit */}
      <style jsx>{`
        .calendar-layout {
          height: 100vh;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          position: relative;
        }

        /* Ultra-Compact Header - 35px total */
        .calendar-header {
          height: 60px;
          min-height: 60px;
          max-height: 60px;
          flex-shrink: 0;
          background: #fff;
          border-bottom: 1px solid #e0e0e0;
          padding: 0;
        }

        .header-content {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-center {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-arrow {
          width: 44px;
          height: 44px;
          border: 1px solid #dadce0;
          border-radius: 8px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #3c4043;
          font-size: 16px;
        }

        .nav-arrow:hover {
          background-color: #f1f3f4;
          border-color: #c0c0c0;
          transform: scale(1.02);
        }

        .nav-arrow:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        .nav-arrow:focus-visible {
          outline: none !important;
        }

        .nav-arrow:active {
          outline: none !important;
          transform: scale(0.98);
        }

        .month-year {
          font-size: 22px;
          font-weight: 500;
          color: #3c4043;
          margin: 0;
          letter-spacing: 0.25px;
        }

        .today-button {
          padding: 8px 16px;
          height: 40px;
          border: 1px solid #1976d2;
          border-radius: 6px;
          background: #1976d2;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }

        .today-button:hover {
          background: #1565c0;
          border-color: #1565c0;
        }

        .today-button:focus {
          outline: 2px solid #1976d2;
          outline-offset: 2px;
        }

        .today-button:active {
          transform: scale(0.98);
        }

        .view-dropdown {
          padding: 8px 12px;
          height: 40px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          background: #fff;
          color: #3c4043;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
          transition: all 0.2s ease;
        }

        .view-dropdown:hover {
          background: #f1f3f4;
          border-color: #c0c0c0;
        }

        .view-dropdown:focus {
          outline: none;
          border-color: #1a73e8;
          box-shadow: 0 0 0 1px #1a73e8;
        }

        /* Calendar Container - Uses exact remaining space */
        .calendar-main {
          flex: 1;
          height: calc(100vh - 60px);
          overflow: hidden;
          background: white;
        }

        .calendar-grid {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* Minimal Day Headers - 25px */
        .day-headers {
          height: 25px;
          min-height: 25px;
          flex-shrink: 0;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: #f8f9fa;
          border-bottom: 1px solid #dadce0;
        }

        .day-header {
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #dadce0;
        }

        .day-header:last-child {
          border-right: none;
        }

        .day-header-text {
          font-size: 9px;
          font-weight: 500;
          color: #70757a;
          letter-spacing: 0.8px;
        }

        /* Dynamic Days Container - Adjusts to required rows */
        .days-container {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(var(--required-rows), 1fr);
          height: calc(100% - 25px);
          min-height: 0;
        }

        /* Day Cells - Size automatically based on available space */
        .day-cell {
          position: relative;
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
          background: white;
          transition: background-color 0.15s ease;
          cursor: pointer;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 0;
          min-height: 0;
        }

        /* Default hover for empty days (grey) */
        .day-cell.empty-day:hover {
          background-color: #f8f9fa !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        /* Hover for days with colors - use color tinting */
        .day-cell.has-color:hover {
          position: relative;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          /* Keep original background color */
          background-color: var(--original-color) !important;
        }

        /* Create lighter tint overlay for colored days */
        .day-cell.has-color:hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.1);
          pointer-events: none;
          transition: all 0.2s ease;
          z-index: 1;
        }

        /* Ensure day content stays above overlay */
        .day-cell > * {
          position: relative;
          z-index: 2;
        }

        .day-cell:focus {
          outline: none;
          box-shadow: inset 0 0 0 2px #1a73e8;
        }

        .day-cell.other-month {
          background: #fafafa;
          color: #9aa0a6;
        }

        .day-cell.today {
          position: relative;
        }

        /* Elegant Today Indicator - Underline Style */
        .day-cell.today::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: #1976d2;
          border-radius: 1px;
          animation: today-underline 2s ease-in-out infinite;
          z-index: 10;
        }

        @keyframes today-underline {
          0%, 100% { 
            opacity: 0.7;
            transform: translateX(-50%) scale(1);
          }
          50% { 
            opacity: 1;
            transform: translateX(-50%) scale(1.1);
          }
        }

        /* Make underline work with colored backgrounds */
        .day-cell.today[style*="background-color"]::after {
          background: white;
          box-shadow: 0 0 0 1px #1976d2;
        }

        /* Remove grid borders on edges */
        .day-cell:nth-child(7n) {
          border-right: none;
        }

        .day-cell:nth-last-child(-n+7) {
          border-bottom: none;
        }

        /* Day Number - Top Center like Google Calendar */
        .day-number {
          position: absolute;
          top: 4px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .day-number-text {
          font-size: 12px;
          font-weight: 400;
          color: inherit;
          line-height: 1;
        }


        /* Day Content Area */
        .day-content {
          flex: 1;
          position: relative;
          margin-top: 24px;
        }

        /* Hover Effect */
        .hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(26, 115, 232, 0.04);
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
        }

        .day-cell:hover .hover-overlay {
          opacity: 1;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .calendar-header {
            height: 50px;
            min-height: 50px;
            max-height: 50px;
          }
          
          .header-content {
            padding: 0 12px;
          }
          
          .header-left {
            gap: 8px;
          }
          
          .header-right {
            gap: 8px;
          }
          
          .nav-arrow {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
          
          .month-year {
            font-size: 18px;
          }
          
          .today-button {
            padding: 6px 12px;
            height: 32px;
            font-size: 12px;
          }
          
          .view-dropdown {
            padding: 6px 8px;
            height: 32px;
            font-size: 12px;
            min-width: 100px;
          }
          
          .calendar-main {
            height: calc(100vh - 50px);
          }
          
          .day-headers {
            height: 20px;
            min-height: 20px;
          }
          
          .days-container {
            height: calc(100% - 20px);
          }
          
          .day-number-text {
            font-size: 11px;
          }
          
          .day-content {
            margin-top: 20px;
          }
          
          .day-header-text {
            font-size: 8px;
          }
        }

        /* Large Screen Optimization */
        @media (min-width: 1400px) {
          .day-number-text {
            font-size: 14px;
          }
          
          .month-year {
            font-size: 16px;
          }
        }

        /* Debug info for development */
        @media (max-width: 1px) {
          .calendar-layout::before {
            content: "Rows: " var(--required-rows);
            position: fixed;
            top: 10px;
            right: 10px;
            background: red;
            color: white;
            padding: 4px 8px;
            font-size: 12px;
            z-index: 1000;
          }
        }
      `}</style>
    </>
  );
};