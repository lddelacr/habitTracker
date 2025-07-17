import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Target, Edit3, Save, X, CheckSquare, Clock } from 'lucide-react';
import { Habit } from '../types/habit';
import { Task } from '../types/task';
import { getCompletionRate, getTodayString } from '../utils/dateUtils';
import { getCategoryById } from '../utils/categoryUtils';

interface TodayViewProps {
  habits: Array<Habit & { isCompletedToday: boolean }>;
  tasks: Task[];
  onToggleCompletion: (id: string) => void;
  onToggleTaskCompletion: (id: string) => void;
  saveHabitNote?: (habitId: string, date: string, note: string) => void;
  getHabitNote?: (habitId: string, date: string) => string;
  saveTaskNote?: (taskId: string, date: string, note: string) => void;
  getTaskNote?: (taskId: string, date: string) => string;
  saveDailyThoughts?: (date: string, thoughts: string) => void;
  getDailyThoughts?: (date: string) => string;
}

export const TodayView: React.FC<TodayViewProps> = ({ 
  habits, 
  tasks,
  onToggleCompletion,
  onToggleTaskCompletion,
  saveHabitNote,
  getHabitNote,
  saveTaskNote,
  getTaskNote,
  saveDailyThoughts,
  getDailyThoughts
}) => {
  const [activeNoteHabit, setActiveNoteHabit] = useState<string | null>(null);
  const [activeNoteTask, setActiveNoteTask] = useState<string | null>(null);
  const [hoveredHabit, setHoveredHabit] = useState<string | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [hoveredCompletedHabit, setHoveredCompletedHabit] = useState<string | null>(null);
  const [hoveredCompletedTask, setHoveredCompletedTask] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [taskNoteText, setTaskNoteText] = useState('');
  const [dailyThoughtsText, setDailyThoughtsText] = useState('');
  const [isEditingThoughts, setIsEditingThoughts] = useState(false);

  // Split habits and tasks into completed and incomplete
  const incompleteHabits = habits.filter(h => !h.isCompletedToday);
  const completedHabits = habits.filter(h => h.isCompletedToday);
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const completedToday = completedHabits.length;
  const totalHabits = habits.length;
  const completedTasksCount = completedTasks.length;
  const totalTasks = tasks.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
  const today = getTodayString();

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Task note handlers
  const handleToggleTaskNote = (taskId: string) => {
    if (activeNoteTask === taskId) {
      setActiveNoteTask(null);
      setTaskNoteText('');
    } else {
      setActiveNoteTask(taskId);
      const existingNote = getTaskNote ? getTaskNote(taskId, getTodayString()) : '';
      setTaskNoteText(existingNote);
    }
  };

  const handleSaveTaskNote = (taskId: string) => {
    if (saveTaskNote) {
      saveTaskNote(taskId, getTodayString(), taskNoteText);
    }
    setActiveNoteTask(null);
    setTaskNoteText('');
  };

  const handleCancelTaskNote = () => {
    setActiveNoteTask(null);
    setTaskNoteText('');
  };

  const hasTaskNote = (taskId: string) => {
    return getTaskNote ? getTaskNote(taskId, getTodayString()).length > 0 : false;
  };

  // Habit note handlers
  const handleToggleNote = (habitId: string) => {
    if (activeNoteHabit === habitId) {
      setActiveNoteHabit(null);
      setNoteText('');
    } else {
      setActiveNoteHabit(habitId);
      const existingNote = getHabitNote ? getHabitNote(habitId, getTodayString()) : '';
      setNoteText(existingNote);
    }
  };

  const handleSaveNote = (habitId: string) => {
    if (saveHabitNote) {
      saveHabitNote(habitId, getTodayString(), noteText);
    }
    setActiveNoteHabit(null);
    setNoteText('');
  };

  const handleCancelNote = () => {
    setActiveNoteHabit(null);
    setNoteText('');
  };

  // Daily thoughts handlers
  const handleEditThoughts = () => {
    setIsEditingThoughts(true);
    const existingThoughts = getDailyThoughts ? getDailyThoughts(getTodayString()) : '';
    setDailyThoughtsText(existingThoughts);
  };

  const handleSaveThoughts = () => {
    if (saveDailyThoughts) {
      saveDailyThoughts(getTodayString(), dailyThoughtsText);
    }
    setIsEditingThoughts(false);
  };

  const handleCancelThoughts = () => {
    setIsEditingThoughts(false);
    setDailyThoughtsText('');
  };

  const hasNote = (habitId: string) => {
    return getHabitNote ? getHabitNote(habitId, getTodayString()).length > 0 : false;
  };

  const currentThoughts = getDailyThoughts ? getDailyThoughts(getTodayString()) : '';

  // Countdown timer calculation
  const getCountdownText = (dueDate: string, dueTime: string) => {
    if (dueTime === '00:00') return null;
    
    const now = new Date();
    const [year, month, day] = dueDate.split('-').map(Number);
    const [hours, minutes] = dueTime.split(':').map(Number);
    const dueDateTime = new Date(year, month - 1, day, hours, minutes);
    
    const diffMs = dueDateTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 0) {
      const overdueMins = Math.abs(diffMinutes);
      const overdueHours = Math.floor(overdueMins / 60);
      const remainingMins = overdueMins % 60;
      
      if (overdueHours > 0) {
        return `Overdue by ${overdueHours}h ${remainingMins}m`;
      } else {
        return `Overdue by ${overdueMins}m`;
      }
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      
      if (hours > 0) {
        return `Due in ${hours}h ${mins}m`;
      } else {
        return `Due in ${mins}m`;
      }
    }
  };

  const formatDueDateTime = (date: string, time?: string) => {
    if (!time) return 'Due Today';
    
    const isAllDay = time === '00:00';
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    if (isAllDay) {
      if (date === today) {
        return null;
      } else {
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    if (date === today) {
      return `Due Today at ${formattedTime}`;
    } else {
      const dateStr = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      return `${dateStr} at ${formattedTime}`;
    }
  };

  if (habits.length === 0 && tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No habits or tasks yet</h3>
        <p className="text-gray-500 mb-6">Start building better habits and organizing your tasks!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Today's Overview</h1>
            <p className="text-blue-100">{todayFormatted}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-2xl font-bold">{completedToday + completedTasksCount}/{totalHabits + totalTasks}</span>
            </div>
            <p className="text-blue-100 text-sm">Completed</p>
          </div>
        </div>
        
        {/* Progress Bars */}
        <div className="mt-6 space-y-4">
          {totalHabits > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Habits Progress</span>
                <span>{completionRate}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
          
          {totalTasks > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Tasks Progress</span>
                <span>{taskCompletionRate}%</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${taskCompletionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Today's Tasks */}
      {incompleteTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Today's Tasks</h2>
              <p className="text-sm text-gray-500">{completedTasksCount} of {totalTasks} completed</p>
            </div>
          </div>

          <div className="today-tasks-list">
            {incompleteTasks.map((task) => {
              const category = getCategoryById(task.category);
              const isOverdue = task.status !== 'completed' && task.dueDate < today;
              const countdownText = getCountdownText(task.dueDate, task.dueTime);
              
              return (
                <div 
                  key={task.id} 
                  className={`task-row ${isOverdue ? 'overdue' : ''} ${hoveredTask === task.id ? 'hover-preview' : ''}`}
                  style={{ '--task-color': category?.color || '#6b7280' }}
                >
                  <div className="task-main-row">
                    <div className="task-main-content">
                      <div 
                        className="task-checkbox-container"
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {hoveredTask === task.id ? (
                          <CheckCircle2
                            className="task-checkbox checked"
                            style={{ color: category?.color || '#6b7280' }}
                            onClick={() => onToggleTaskCompletion(task.id)}
                          />
                        ) : (
                          <Circle
                            className="task-checkbox"
                            style={{ color: category?.color || '#6b7280' }}
                            onClick={() => onToggleTaskCompletion(task.id)}
                          />
                        )}
                      </div>
                      
                      <div className="task-info">
                        <h3 className={`task-name ${hoveredTask === task.id ? 'hover-preview-text' : ''}`}>{task.name}</h3>
                        <span className="task-category">
                          {category?.name || 'Uncategorized'}
                        </span>
                        {task.description && (
                          <p className={`task-description ${hoveredTask === task.id ? 'hover-preview-text' : ''}`}>{task.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="task-details">
                      
                      {countdownText && (
                        <div className={`task-countdown ${isOverdue ? 'overdue' : ''}`}>
                          <Clock className="w-3 h-3" />
                          <span className="countdown-text">{countdownText}</span>
                        </div>
                      )}
                      
                      {formatDueDateTime(task.dueDate, task.dueTime) && (
                        <span className="task-due-time">
                          {formatDueDateTime(task.dueDate, task.dueTime)}
                        </span>
                      )}
                    </div>
                    
                    <div className="task-actions">
                      <button
                        onClick={() => handleToggleTaskNote(task.id)}
                        className={`note-btn ${hasTaskNote(task.id) || activeNoteTask === task.id ? 'has-note' : ''}`}
                        title="Add note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {activeNoteTask === task.id && (
                    <div className="task-note-section">
                      <textarea
                        value={taskNoteText}
                        onChange={(e) => setTaskNoteText(e.target.value)}
                        placeholder="Add a note for this task..."
                        className="task-note-input"
                        rows={3}
                      />
                      <div className="note-actions">
                        <button onClick={() => handleSaveTaskNote(task.id)} className="save-btn">
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button onClick={handleCancelTaskNote} className="cancel-btn">
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Habits */}
      {incompleteHabits.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Today's Habits</h2>
              <p className="text-sm text-gray-500">{completedToday} of {totalHabits} completed</p>
            </div>
          </div>

          <div className="today-habits-list">
            {incompleteHabits.map((habit) => {
              const category = getCategoryById(habit.category);
              const habitColor = habit.color || category?.color || '#6b7280';
              const weeklyRate = getCompletionRate(habit, 'week');
              const monthlyRate = getCompletionRate(habit, 'month');
              
              return (
                <div 
                  key={habit.id} 
                  className={`habit-row ${hoveredHabit === habit.id ? 'hover-preview' : ''}`}
                  style={{ '--habit-color': habitColor }}
                >
                  <div className="habit-main-row">
                    <div className="habit-main-content">
                      <div 
                        className="habit-checkbox-container"
                        onMouseEnter={() => setHoveredHabit(habit.id)}
                        onMouseLeave={() => setHoveredHabit(null)}
                      >
                        {hoveredHabit === habit.id ? (
                          <CheckCircle2
                            className="habit-checkbox checked"
                            style={{ color: habitColor }}
                            onClick={() => onToggleCompletion(habit.id)}
                          />
                        ) : (
                          <Circle
                            className="habit-checkbox"
                            style={{ color: habitColor }}
                            onClick={() => onToggleCompletion(habit.id)}
                          />
                        )}
                      </div>
                      
                      <div className="habit-info">
                        <h3 className={`habit-name ${hoveredHabit === habit.id ? 'hover-preview-text' : ''}`}>{habit.name}</h3>
                        <span className="habit-category">
                          {category?.name || 'Uncategorized'}
                        </span>
                        {habit.description && (
                          <p className={`habit-description ${hoveredHabit === habit.id ? 'hover-preview-text' : ''}`}>{habit.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="habit-stats">
                      <div className="stat-item current-streak">
                        <span className="stat-value">{habit.currentStreak}</span>
                        <span className="stat-label">STREAK</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{weeklyRate}%</span>
                        <span className="stat-label">WEEK</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{monthlyRate}%</span>
                        <span className="stat-label">MONTH</span>
                      </div>
                    </div>
                    
                    <div className="habit-actions">
                      <button
                        onClick={() => handleToggleNote(habit.id)}
                        className={`note-btn ${hasNote(habit.id) || activeNoteHabit === habit.id ? 'has-note' : ''}`}
                        title="Add note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {activeNoteHabit === habit.id && (
                    <div className="note-input-section">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note for this habit..."
                        className="note-textarea"
                        rows={3}
                      />
                      <div className="note-actions">
                        <button onClick={() => handleSaveNote(habit.id)} className="save-btn">
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button onClick={handleCancelNote} className="cancel-btn">
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {(completedHabits.length > 0 || completedTasks.length > 0) && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Completed</h2>
              <p className="text-sm text-gray-500">
                {completedHabits.length + completedTasks.length} item{completedHabits.length + completedTasks.length !== 1 ? 's' : ''} completed today
              </p>
            </div>
          </div>

          <div className="completed-list">
            {/* Tasks Separator */}
            {completedTasks.length > 0 && completedHabits.length > 0 && (
              <div className="completed-separator">
                <div className="separator-line"></div>
                <span className="separator-label">Tasks</span>
                <div className="separator-line"></div>
              </div>
            )}
            
            {/* Completed Tasks */}
            {completedTasks.map((task) => {
              const category = getCategoryById(task.category);
              
              return (
                <div 
                  key={task.id} 
                  className={`task-row completed ${hoveredCompletedTask === task.id ? 'hover-preview' : ''}`}
                  style={{ '--task-color': category?.color || '#6b7280' }}
                >
                  <div className="task-main-row">
                    <div className="task-main-content">
                      <div 
                        className="task-checkbox-container"
                        onMouseEnter={() => setHoveredCompletedTask(task.id)}
                        onMouseLeave={() => setHoveredCompletedTask(null)}
                      >
                        {hoveredCompletedTask === task.id ? (
                          <Circle
                            className="task-checkbox"
                            style={{ color: category?.color || '#6b7280' }}
                            onClick={() => onToggleTaskCompletion(task.id)}
                          />
                        ) : (
                          <CheckCircle2
                            className="task-checkbox checked"
                            style={{ color: category?.color || '#6b7280' }}
                            onClick={() => onToggleTaskCompletion(task.id)}
                          />
                        )}
                      </div>
                      
                      <div className="task-info">
                        <h3 className={`task-name ${hoveredCompletedTask === task.id ? '' : 'completed-text'}`}>{task.name}</h3>
                        <span className="task-category">
                          {category?.name || 'Uncategorized'}
                        </span>
                        {task.description && (
                          <p className={`task-description ${hoveredCompletedTask === task.id ? '' : 'completed-text'}`}>{task.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="task-details">
                      {formatDueDateTime(task.dueDate, task.dueTime) && (
                        <span className="task-due-time">
                          {formatDueDateTime(task.dueDate, task.dueTime)}
                        </span>
                      )}
                    </div>
                    
                    <div className="task-actions">
                      <button
                        onClick={() => handleToggleTaskNote(task.id)}
                        className={`note-btn ${hasTaskNote(task.id) || activeNoteTask === task.id ? 'has-note' : ''}`}
                        title="Add note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {activeNoteTask === task.id && (
                    <div className="task-note-section">
                      <textarea
                        value={taskNoteText}
                        onChange={(e) => setTaskNoteText(e.target.value)}
                        placeholder="Add a note for this task..."
                        className="task-note-input"
                        rows={3}
                      />
                      <div className="note-actions">
                        <button onClick={() => handleSaveTaskNote(task.id)} className="save-btn">
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button onClick={handleCancelTaskNote} className="cancel-btn">
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Separator between Tasks and Habits */}
            {completedTasks.length > 0 && completedHabits.length > 0 && (
              <div className="completed-separator">
                <div className="separator-line"></div>
                <span className="separator-label">Habits</span>
                <div className="separator-line"></div>
              </div>
            )}
            
            {/* Completed Habits */}
            {completedHabits.map((habit) => {
              const category = getCategoryById(habit.category);
              const habitColor = habit.color || category?.color || '#6b7280';
              const weeklyRate = getCompletionRate(habit, 'week');
              const monthlyRate = getCompletionRate(habit, 'month');
              
              return (
                <div 
                  key={habit.id} 
                  className={`habit-row completed ${hoveredCompletedHabit === habit.id ? 'hover-preview' : ''}`}
                  style={{ '--habit-color': habitColor }}
                >
                  <div className="habit-main-row">
                    <div className="habit-main-content">
                      <div 
                        className="habit-checkbox-container"
                        onMouseEnter={() => setHoveredCompletedHabit(habit.id)}
                        onMouseLeave={() => setHoveredCompletedHabit(null)}
                      >
                        {hoveredCompletedHabit === habit.id ? (
                          <Circle
                            className="habit-checkbox"
                            style={{ color: habitColor }}
                            onClick={() => onToggleCompletion(habit.id)}
                          />
                        ) : (
                          <CheckCircle2
                            className="habit-checkbox checked"
                            style={{ color: habitColor }}
                            onClick={() => onToggleCompletion(habit.id)}
                          />
                        )}
                      </div>
                      
                      <div className="habit-info">
                        <h3 className={`habit-name ${hoveredCompletedHabit === habit.id ? '' : 'completed-text'}`}>{habit.name}</h3>
                        <span className="habit-category">
                          {category?.name || 'Uncategorized'}
                        </span>
                        {habit.description && (
                          <p className={`habit-description ${hoveredCompletedHabit === habit.id ? '' : 'completed-text'}`}>{habit.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="habit-stats">
                      <div className="stat-item current-streak">
                        <span className="stat-value">{habit.currentStreak}</span>
                        <span className="stat-label">STREAK</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{weeklyRate}%</span>
                        <span className="stat-label">WEEK</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{monthlyRate}%</span>
                        <span className="stat-label">MONTH</span>
                      </div>
                    </div>
                    
                    <div className="habit-actions">
                      <button
                        onClick={() => handleToggleNote(habit.id)}
                        className={`note-btn ${hasNote(habit.id) || activeNoteHabit === habit.id ? 'has-note' : ''}`}
                        title="Add note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {activeNoteHabit === habit.id && (
                    <div className="note-input-section">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note for this habit..."
                        className="note-textarea"
                        rows={3}
                      />
                      <div className="note-actions">
                        <button onClick={() => handleSaveNote(habit.id)} className="save-btn">
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button onClick={handleCancelNote} className="cancel-btn">
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Thoughts */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Edit3 className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Daily Thoughts</h2>
        </div>

        {isEditingThoughts ? (
          <div className="thoughts-input-section">
            <textarea
              value={dailyThoughtsText}
              onChange={(e) => setDailyThoughtsText(e.target.value)}
              placeholder="How was your day? What are you thinking about?"
              className="thoughts-textarea"
              rows={4}
            />
            <div className="thoughts-actions">
              <button onClick={handleSaveThoughts} className="save-thoughts-btn">
                <Save className="w-4 h-4 mr-2" />
                Save Thoughts
              </button>
              <button onClick={handleCancelThoughts} className="cancel-thoughts-btn">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="thoughts-display">
            {currentThoughts ? (
              <div className="thoughts-content">
                <div className="thoughts-text">{currentThoughts}</div>
                <button onClick={handleEditThoughts} className="edit-thoughts-btn">
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
            ) : (
              <div className="thoughts-empty">
                <p className="empty-text">No thoughts recorded for today</p>
                <button onClick={handleEditThoughts} className="add-thoughts-btn">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Add Daily Thoughts
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Daily Motivation */}
      {completionRate === 100 && taskCompletionRate === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">Perfect day!</h3>
          <p className="text-green-600">You've completed all your habits and tasks for today.</p>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        /* TODAY TAB - IMPROVED LIST FORMAT */
        .today-habits-list, .today-tasks-list, .completed-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .habit-row, .task-row {
          display: flex;
          flex-direction: column;
          padding: 20px 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-left: 4px solid var(--habit-color, var(--task-color));
          border-radius: 12px;
          margin-bottom: 0;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }

        .habit-row:hover, .task-row:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .habit-main-row, .task-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        /* Completed State Styling */
        .habit-row.completed, .task-row.completed {
          background: #f9fafb;
          opacity: 0.85;
        }

        /* Hover Preview Styling */
        .habit-row.hover-preview, .task-row.hover-preview {
          background: #f9fafb;
          transition: background-color 0.2s ease;
        }

        .hover-preview-text {
          color: #6b7280;
          text-decoration: line-through;
          text-decoration-color: #9ca3af;
          transition: all 0.2s ease;
        }

        .completed-text {
          color: #6b7280;
          text-decoration: line-through;
          text-decoration-color: #9ca3af;
        }

        .task-row.overdue {
          border-left-color: #ef4444;
          background: #fef2f2;
        }

        .habit-main-content, .task-main-content {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 16px;
        }

        .habit-checkbox-container, .task-checkbox-container {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .habit-checkbox, .task-checkbox {
          width: 24px;
          height: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 2;
        }

        .habit-checkbox:hover, .task-checkbox:hover {
          transform: scale(1.05);
        }

        .habit-checkbox.checked, .task-checkbox.checked {
          transform: scale(1.0);
        }

        .habit-checkbox.checked:hover, .task-checkbox.checked:hover {
          transform: scale(1.05);
        }

        .habit-info, .task-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .habit-name, .task-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          transition: color 0.2s ease;
          margin: 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .habit-category, .task-category {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
          width: fit-content;
        }

        .habit-description, .task-description {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
          line-height: 1.4;
          font-style: italic;
          opacity: 0.9;
          max-width: 320px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .habit-stats {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .stat-item {
          text-align: center;
          min-width: 55px;
        }

        .stat-value {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: #6b7280;
          line-height: 1;
        }

        .stat-label {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
          display: block;
        }

        .stat-item.current-streak .stat-value {
          color: #6b7280;
          font-size: 16px;
        }

        .task-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-end;
          min-width: 140px;
          margin-right: 20px;
        }

        .task-due-time {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .priority {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .priority-low {
          background: #dbeafe;
          color: #1e40af;
        }

        .priority-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-high {
          background: #fee2e2;
          color: #991b1b;
        }

        .task-countdown {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: #ecfdf5;
          border-radius: 6px;
          border: 1px solid #d1fae5;
        }

        .task-countdown.overdue {
          color: #ef4444;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .countdown-text {
          font-size: 11px;
          font-weight: 600;
        }

        .habit-actions, .task-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .note-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .note-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .note-btn.has-note {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }

        /* Task Note Section */
        .task-note-section, .note-input-section {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .task-note-input, .note-textarea {
          width: 100%;
          min-height: 60px;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 12px;
          transition: border-color 0.2s ease;
        }

        .task-note-input:focus, .note-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .note-actions {
          display: flex;
          gap: 8px;
        }

        .save-btn, .cancel-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .save-btn {
          background: #3b82f6;
          color: white;
        }

        .save-btn:hover {
          background: #2563eb;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        /* Daily Thoughts Styling */
        .thoughts-input-section {
          space-y: 12px;
        }

        .thoughts-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          resize: vertical;
          margin-bottom: 12px;
        }

        .thoughts-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
        }

        .thoughts-actions {
          display: flex;
          gap: 8px;
        }

        .save-thoughts-btn, .cancel-thoughts-btn {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .save-thoughts-btn {
          background: #3b82f6;
          color: white;
        }

        .save-thoughts-btn:hover {
          background: #2563eb;
        }

        .cancel-thoughts-btn {
          background: #e5e7eb;
          color: #374151;
        }

        .cancel-thoughts-btn:hover {
          background: #d1d5db;
        }

        .thoughts-display {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .thoughts-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .thoughts-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .edit-thoughts-btn, .add-thoughts-btn {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
          align-self: flex-start;
          padding: 4px 0;
        }

        .edit-thoughts-btn:hover, .add-thoughts-btn:hover {
          color: #374151;
        }

        .thoughts-empty {
          text-align: center;
          padding: 20px;
        }

        .empty-text {
          color: #9ca3af;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .add-thoughts-btn {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 8px 16px;
          text-decoration: none;
          color: #374151;
          font-weight: 500;
        }

        .add-thoughts-btn:hover {
          background: #e5e7eb;
        }

        /* Completed Section Separator */
        .completed-separator {
          display: flex;
          align-items: center;
          margin: 20px 0;
          gap: 12px;
        }

        .separator-line {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .separator-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0 4px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .habit-row, .task-row {
            padding: 16px;
          }
          
          .habit-main-row, .task-main-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .habit-main-content, .task-main-content {
            width: 100%;
          }

          .habit-stats {
            width: 100%;
            justify-content: space-around;
            padding-top: 12px;
            border-top: 1px solid #f3f4f6;
            gap: 16px;
          }

          .task-details {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid #f3f4f6;
          }

          .habit-actions {
            margin-left: 0;
            margin-top: 8px;
          }

          .task-actions {
            margin-left: 0;
            margin-top: 8px;
          }

          .task-details {
            margin-right: 0;
          }
        }
      `}</style>
    </div>
  );
};