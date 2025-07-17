import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, X, Edit3, Save, CheckCircle2, Circle, Plus } from 'lucide-react';
import { Habit } from '../types/habit';
import { Task } from '../types/task';
import {
  formatDate, 
  isSameDay, 
  isSameMonth,
  getMonthName
} from '../utils/dateUtils';
import { getCategoryById } from '../utils/categoryUtils';

// Calculate required rows for a given month (minimum needed)
const getRequiredRows = (year: number, month: number): number => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Calculate minimum rows needed
  const totalCells = startDayOfWeek + daysInMonth;
  return Math.ceil(totalCells / 7);
};

// Generate calendar days for the exact number of rows needed (timezone-safe)
const generateCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const startOfWeek = new Date(firstDay);
  
  // Adjust to start on Sunday to match day headers
  const dayOfWeek = firstDay.getDay();
  startOfWeek.setDate(firstDay.getDate() - dayOfWeek);
  
  const days: Date[] = [];
  const requiredRows = getRequiredRows(year, month);
  
  // Generate exactly the number of days needed (timezone-safe)
  for (let i = 0; i < requiredRows * 7; i++) {
    // Create new date object to avoid timezone shifts
    const tempDate = new Date(startOfWeek);
    tempDate.setDate(tempDate.getDate() + i);
    days.push(new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()));
  }
  
  return days;
};

// Get habits that are scheduled for a specific day (timezone-safe)
const getHabitsForDay = (date: Date, allHabits: Habit[]): Habit[] => {
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const clickedDayName = dayNames[dayOfWeek];
  const dateString = formatDate(date);
  
  return allHabits.filter(habit => {
    // Only show habits that were created before or on this date
    if (habit.createdDate > dateString) {
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

// Get habits for a date string (timezone-safe)
const getHabitsForDateString = (dateString: string, allHabits: Habit[]): Habit[] => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const clickedDayName = dayNames[dayOfWeek];
  
  return allHabits.filter(habit => {
    // Only show habits that were created before or on this date
    if (habit.createdDate > dateString) {
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

interface CalendarViewProps {
  habits: Habit[];
  tasks?: Task[];
  onToggleCompletion: (id: string) => void;
  onToggleCompletionForDate: (habitId: string, date: string) => void;
  onToggleTaskCompletion?: (id: string) => void;
  getHabitNote: (habitId: string, date: string) => string;
  saveHabitNote: (habitId: string, date: string, note: string) => void;
  getTaskNote?: (taskId: string, date: string) => string;
  saveTaskNote?: (taskId: string, date: string, note: string) => void;
  getDailyThoughts: (date: string) => string;
  saveDailyThoughts: (date: string, thoughts: string) => void;
  onAddTask?: (task: Partial<Task>) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  habits, 
  tasks = [],
  onToggleCompletion,
  onToggleCompletionForDate,
  onToggleTaskCompletion,
  getHabitNote,
  saveHabitNote,
  getTaskNote,
  saveTaskNote,
  getDailyThoughts,
  saveDailyThoughts,
  onAddTask
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<string>('all-habits');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [, setForceUpdate] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  
  // Calculate required rows for current month
  const requiredRows = getRequiredRows(year, month);

  // Listen for completion changes to force calendar updates
  useEffect(() => {
    const handleCompletionChange = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('habitCompletionChanged', handleCompletionChange as EventListener);
    window.addEventListener('taskCompletionChanged', handleCompletionChange as EventListener);
    
    return () => {
      window.removeEventListener('habitCompletionChanged', handleCompletionChange as EventListener);
      window.removeEventListener('taskCompletionChanged', handleCompletionChange as EventListener);
    };
  }, []);

  // Force update when props change
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [habits, tasks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(formatDate(day));
  };

  const closeModal = () => {
    setSelectedDay(null);
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const dateString = formatDate(date);
    return tasks.filter(task => task.dueDate === dateString);
  };

  // Get habits for a specific date
  const getHabitsForDate = (date: Date): Habit[] => {
    return getHabitsForDay(date, habits);
  };

  // Check if habit is completed on a specific date (timezone-safe)
  const isHabitCompletedOnDate = (habit: Habit, date: Date): boolean => {
    const dateString = formatDate(date);
    return habit.completions.includes(dateString);
  };

  // Check if all habits are completed on a date (timezone-safe)
  const isAllHabitsCompleted = (dateString: string): boolean => {
    const dayHabits = getHabitsForDateString(dateString, habits);
    if (dayHabits.length === 0) return false;
    
    return dayHabits.every(habit => habit.completions.includes(dateString));
  };

  // Get selected habit for individual habit view
  const getSelectedHabit = () => {
    if (selectedView === 'all-habits' || selectedView === 'all-tasks') return null;
    return habits.find(habit => habit.id === selectedView);
  };

  // Get background style for calendar days based on current view
  const getDayBackgroundStyle = (day: Date) => {
    const dateString = formatDate(day);

    if (selectedView === 'all-tasks') {
      // Tasks view - no background colors, clean look
      return {
        backgroundColor: 'transparent',
        color: '#374151',
        '--original-color': '#374151'
      };
    }

    // Existing habit logic for habit views
    if (selectedView === 'all-habits') {
      const isPerfectDay = isAllHabitsCompleted(dateString);
      return {
        backgroundColor: isPerfectDay ? '#10b981' : 'transparent',
        color: isPerfectDay ? '#ffffff' : '#374151',
        '--original-color': isPerfectDay ? '#10b981' : '#374151'
      };
    }

    // Individual habit view
    const selectedHabit = getSelectedHabit();
    if (selectedHabit) {
      const isCompleted = isHabitCompletedOnDate(selectedHabit, day);
      const habitColor = selectedHabit.customColor || selectedHabit.color;
      return {
        backgroundColor: isCompleted ? habitColor : 'transparent',
        color: isCompleted ? '#ffffff' : '#374151',
        '--original-color': isCompleted ? habitColor : '#374151'
      };
    }

    return {
      backgroundColor: 'transparent',
      color: '#374151',
      '--original-color': '#374151'
    };
  };

  // Render task labels for calendar cells
  const renderTaskLabels = (day: Date) => {
    const dayTasks = getTasksForDate(day);
    if (dayTasks.length === 0) return null;

    const displayTasks = dayTasks.slice(0, 2); // Show max 2 tasks
    const remainingCount = dayTasks.length - 2;

    return (
      <div className="task-labels">
        {displayTasks.map(task => {
          const taskColor = task.customColor || task.color;
          return (
            <div 
              key={task.id}
              className={`task-label ${task.status === 'completed' ? 'completed' : ''}`}
              style={{ color: taskColor }}
            >
              <span className={task.status === 'completed' ? 'line-through opacity-70' : ''}>
                {task.name.length > 12 ? `${task.name.substring(0, 12)}...` : task.name}
              </span>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="task-overflow text-xs text-gray-500">
            +{remainingCount} more
          </div>
        )}
      </div>
    );
  };

  // Render habit content
  const renderHabitContent = (day: Date) => {
    const dateString = formatDate(day);
    const selectedHabit = getSelectedHabit();

    // Individual habit view - no additional content needed (background is colored)
    if (selectedView !== 'all-habits' && selectedView !== 'all-tasks' && selectedHabit) {
      return null;
    }

    // All habits view - show perfect day indicators
    if (selectedView === 'all-habits') {
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
      return null;
    }

    return null;
  };

  // Use the optimized calendar generation function
  const displayedDays = generateCalendarDays(year, month);

  // Enhanced Day Details Modal Component (Inline)
  const DayDetailsModal: React.FC<{
    selectedDay: string;
    habits: Habit[];
    tasks: Task[];
    onClose: () => void;
    onToggleCompletion: (habitId: string) => void;
    onToggleCompletionForDate: (habitId: string, date: string) => void;
    onToggleTaskCompletion?: (taskId: string) => void;
    getHabitNote: (habitId: string, date: string) => string;
    saveHabitNote: (habitId: string, date: string, note: string) => void;
    getTaskNote?: (taskId: string, date: string) => string;
    saveTaskNote?: (taskId: string, date: string, note: string) => void;
    getDailyThoughts: (date: string) => string;
    saveDailyThoughts: (date: string, thoughts: string) => void;
    onAddTask?: (task: Partial<Task>) => void;
  }> = ({
    selectedDay,
    onClose,
    onToggleCompletionForDate,
    onToggleTaskCompletion,
    getHabitNote,
    saveHabitNote,
    getTaskNote,
    saveTaskNote,
    getDailyThoughts,
    saveDailyThoughts,
    onAddTask
  }) => {
    const [thoughts, setThoughts] = useState('');
    const [isEditingThoughts, setIsEditingThoughts] = useState(false);
    const [activeNoteHabit, setActiveNoteHabit] = useState<string | null>(null);
    const [activeNoteTask, setActiveNoteTask] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [taskNoteText, setTaskNoteText] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');

    // Parse selectedDay string to Date object (timezone-safe)
    const [year, month, day] = selectedDay.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // month is 0-indexed

    // Get habits for this day
    const dayHabits = getHabitsForDate(selectedDate);
    const dayTasks = getTasksForDate(selectedDate);

    // Calculate completion stats
    const completedHabits = dayHabits.filter(habit => isHabitCompletedOnDate(habit, selectedDate)).length;
    const completedTasks = dayTasks.filter(task => task.status === 'completed').length;

    // Load daily thoughts
    useEffect(() => {
      const currentThoughts = getDailyThoughts(selectedDay);
      setThoughts(currentThoughts);
    }, [selectedDay, getDailyThoughts]);

    // Format date for display (timezone-safe)
    const formatModalDate = (dateString: string) => {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Handle daily thoughts
    const handleSaveThoughts = () => {
      saveDailyThoughts(selectedDay, thoughts);
      setIsEditingThoughts(false);
    };

    const handleCancelThoughts = () => {
      setThoughts(getDailyThoughts(selectedDay));
      setIsEditingThoughts(false);
    };

    // Handle habit notes
    const handleToggleHabitNote = (habitId: string) => {
      if (activeNoteHabit === habitId) {
        setActiveNoteHabit(null);
        setNoteText('');
      } else {
        setActiveNoteHabit(habitId);
        const existingNote = getHabitNote(habitId, selectedDay);
        setNoteText(existingNote);
      }
    };

    const handleSaveHabitNote = (habitId: string) => {
      saveHabitNote(habitId, selectedDay, noteText);
      setActiveNoteHabit(null);
      setNoteText('');
    };

    // Handle task notes
    const handleToggleTaskNote = (taskId: string) => {
      if (activeNoteTask === taskId) {
        setActiveNoteTask(null);
        setTaskNoteText('');
      } else {
        setActiveNoteTask(taskId);
        const existingNote = getTaskNote ? getTaskNote(taskId, selectedDay) : '';
        setTaskNoteText(existingNote);
      }
    };

    const handleSaveTaskNote = (taskId: string) => {
      if (saveTaskNote) {
        saveTaskNote(taskId, selectedDay, taskNoteText);
      }
      setActiveNoteTask(null);
      setTaskNoteText('');
    };

    // Handle quick task creation
    const handleAddTask = () => {
      if (newTaskName.trim() && onAddTask) {
        onAddTask({
          name: newTaskName.trim(),
          category: 'personal',
          dueDate: selectedDay,
          dueTime: '09:00',
          status: 'pending',
          description: ''
        });
        setNewTaskName('');
        setIsAddingTask(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {formatModalDate(selectedDay)}
              </h2>
              <p className="text-sm text-gray-500">
                {completedHabits} of {dayHabits.length} habits • {completedTasks} of {dayTasks.length} tasks
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Daily Thoughts Section */}
            <section>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Daily Thoughts
              </h3>
              
              {isEditingThoughts ? (
                <div className="space-y-3">
                  <textarea
                    value={thoughts}
                    onChange={(e) => setThoughts(e.target.value)}
                    placeholder="How was your day? Any reflections?"
                    className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveThoughts}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelThoughts}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {thoughts ? (
                    <div
                      onClick={() => setIsEditingThoughts(true)}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                    >
                      <p className="text-gray-700 text-sm leading-relaxed">{thoughts}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingThoughts(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors text-sm"
                    >
                      Add Daily Thoughts
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Habits Section */}
            <section>
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Habits ({completedHabits}/{dayHabits.length})
              </h3>
              
              {dayHabits.length === 0 ? (
                <p className="text-gray-500 text-sm italic py-4">No habits scheduled for this day</p>
              ) : (
                <div className="space-y-3">
                  {dayHabits.map(habit => {
                    const isCompleted = isHabitCompletedOnDate(habit, selectedDate);
                    const category = getCategoryById(habit.category);
                    const habitColor = habit.customColor || habit.color;
                    const hasNote = getHabitNote(habit.id, selectedDay);

                    return (
                      <div key={habit.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleCompletionForDate(habit.id, selectedDay)}
                            className="flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" style={{ color: habitColor }} />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                              >
                                {habit.name}
                              </span>
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: habitColor }}
                              >
                                {category?.name || 'Uncategorized'}
                              </span>
                            </div>
                            {habit.description && (
                              <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
                            )}
                          </div>

                          <button
                            onClick={() => handleToggleHabitNote(habit.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              hasNote || activeNoteHabit === habit.id
                                ? 'bg-blue-100 text-blue-600'
                                : 'hover:bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Habit Note */}
                        {activeNoteHabit === habit.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add a note for this habit..."
                              className="w-full p-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveHabitNote(habit.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setActiveNoteHabit(null);
                                  setNoteText('');
                                }}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Display existing note */}
                        {hasNote && activeNoteHabit !== habit.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600 italic">{hasNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Tasks Section */}
            <section>
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center justify-between">
                <span>Tasks ({completedTasks}/{dayTasks.length})</span>
                {onAddTask && (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </h3>

              {/* Quick Add Task */}
              {isAddingTask && (
                <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Task name..."
                    className="w-full p-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddTask}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTask(false);
                        setNewTaskName('');
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {dayTasks.length === 0 && !isAddingTask ? (
                <p className="text-gray-500 text-sm italic py-4">No tasks for this day</p>
              ) : (
                <div className="space-y-3">
                  {dayTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const category = getCategoryById(task.category);
                    const taskColor = task.customColor || task.color;
                    const hasNote = getTaskNote ? getTaskNote(task.id, selectedDay) : '';

                    return (
                      <div key={task.id} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleTaskCompletion?.(task.id)}
                            className="flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" style={{ color: taskColor }} />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}
                              >
                                {task.name}
                              </span>
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: taskColor }}
                              >
                                {category?.name || 'Uncategorized'}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            )}
                            {task.dueTime !== '00:00' && (
                              <p className="text-xs text-gray-400 mt-1">Due: {task.dueTime}</p>
                            )}
                          </div>

                          {getTaskNote && saveTaskNote && (
                            <button
                              onClick={() => handleToggleTaskNote(task.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                hasNote || activeNoteTask === task.id
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'hover:bg-gray-100 text-gray-400'
                              }`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Task Note */}
                        {activeNoteTask === task.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <textarea
                              value={taskNoteText}
                              onChange={(e) => setTaskNoteText(e.target.value)}
                              placeholder="Add a note for this task..."
                              className="w-full p-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveTaskNote(task.id)}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setActiveNoteTask(null);
                                  setTaskNoteText('');
                                }}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Display existing note */}
                        {hasNote && activeNoteTask !== task.id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-sm text-gray-600 italic">{hasNote}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Global CSS */}
      <style jsx global>{`
        .calendar-view-container {
          overflow: hidden;
        }
        
        /* Task labels styling */
        .task-labels {
          position: absolute;
          top: 28px;
          left: 4px;
          right: 4px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          pointer-events: none;
        }
        
        .task-label {
          font-size: 10px;
          font-weight: 500;
          line-height: 1.2;
          background: rgba(255, 255, 255, 0.9);
          padding: 1px 3px;
          border-radius: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-left: 2px solid currentColor;
        }
        
        .task-label.completed {
          background: rgba(0, 0, 0, 0.05);
        }
        
        .task-overflow {
          font-size: 9px;
          padding: 1px 3px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          text-align: center;
        }
      `}</style>

      <div className="calendar-layout" style={{ '--required-rows': requiredRows } as React.CSSProperties}>
        {/* Header */}
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

            {/* Right: Controls - UPDATED DROPDOWN */}
            <div className="header-right">
              <button onClick={goToToday} className="today-button">
                Today
              </button>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="view-dropdown"
              >
                <option value="all-habits">All Habits</option>
                <option value="all-tasks">All Tasks</option>
                <optgroup label="Individual Habits">
                  {habits.map(habit => (
                    <option key={habit.id} value={habit.id}>
                      {habit.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="calendar-main">
          <div className="calendar-grid">
            {/* Day Headers */}
            <div className="day-headers">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="day-header">
                  <span className="day-header-text">
                    {day.slice(0, 3).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="days-container">
              {displayedDays.map((day, index) => {
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
                    {/* Day Number */}
                    <div className="day-number">
                      <span className="day-number-text">
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Content Area - conditional rendering based on view */}
                    <div className="day-content">
                      {selectedView === 'all-tasks' ? renderTaskLabels(day) : renderHabitContent(day)}
                    </div>

                    {/* Hover Effect */}
                    <div className="hover-overlay" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day Details Modal - Enhanced to include tasks */}
        {selectedDay && (
          <DayDetailsModal
            selectedDay={selectedDay}
            habits={habits}
            tasks={getTasksForDate((() => {
              const [year, month, day] = selectedDay.split('-').map(Number);
              return new Date(year, month - 1, day);
            })())}
            onClose={closeModal}
            onToggleCompletion={onToggleCompletion}
            onToggleCompletionForDate={onToggleCompletionForDate}
            onToggleTaskCompletion={onToggleTaskCompletion}
            getHabitNote={getHabitNote}
            saveHabitNote={saveHabitNote}
            getTaskNote={getTaskNote}
            saveTaskNote={saveTaskNote}
            getDailyThoughts={getDailyThoughts}
            saveDailyThoughts={saveDailyThoughts}
            onAddTask={onAddTask}
          />
        )}
      </div>

      {/* CSS Styles - Viewport-optimized */}
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
        }

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
          max-width: 100%;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
          min-width: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .month-year {
          font-size: 20px;
          font-weight: 500;
          color: #202124;
          margin: 0;
          white-space: nowrap;
        }

        .nav-arrow {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #5f6368;
          transition: all 0.2s ease;
        }

        .nav-arrow:hover {
          background: #f1f3f4;
          color: #202124;
        }

        .today-button {
          padding: 8px 16px;
          height: 40px;
          border: 1px solid #dadce0;
          border-radius: 6px;
          background: #fff;
          color: #1a73e8;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .today-button:hover {
          background: #f8f9fa;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

        .calendar-main {
          flex: 1;
          height: calc(100vh - 60px);
          overflow: hidden;
          background: white;
          display: flex;
          flex-direction: column;
        }

        .calendar-grid {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .day-headers {
          height: 30px;
          min-height: 30px;
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
          font-size: 10px;
          font-weight: 500;
          color: #70757a;
          letter-spacing: 0.8px;
        }

        .days-container {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(var(--required-rows), 1fr);
          gap: 0;
          background: white;
          height: calc(100vh - 90px);
        }

        .day-cell {
          position: relative;
          border: none;
          border-right: 1px solid #dadce0;
          border-bottom: 1px solid #dadce0;
          background: transparent;
          cursor: pointer;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          transition: all 0.2s ease;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }

        .day-cell:nth-child(7n) {
          border-right: none;
        }

        .day-cell.other-month {
          color: #9aa0a6 !important;
          background: #f8f9fa !important;
        }

        .day-cell.today .day-number-text {
          background: #1a73e8;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .day-number {
          position: absolute;
          top: 4px;
          left: 6px;
          z-index: 2;
        }

        .day-number-text {
          font-size: 12px;
          font-weight: 400;
          line-height: 1;
          min-width: 20px;
          text-align: center;
        }

        .day-content {
          position: relative;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .hover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: transparent;
          transition: background 0.2s ease;
          pointer-events: none;
        }

        .day-cell.empty-day:hover .hover-overlay {
          background: rgba(0, 0, 0, 0.05);
        }

        .day-cell.has-color:hover .hover-overlay {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
};