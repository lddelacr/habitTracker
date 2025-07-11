import React, { useState } from 'react';
import { Calendar, CheckCircle2, Target, Flame, Star, Edit3, Save, X, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
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
  const [noteText, setNoteText] = useState('');
  const [taskNoteText, setTaskNoteText] = useState('');
  const [dailyThoughtsText, setDailyThoughtsText] = useState('');
  const [isEditingThoughts, setIsEditingThoughts] = useState(false);

  const completedToday = habits.filter(h => h.isCompletedToday).length;
  const totalHabits = habits.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
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

  // Habit note handlers (existing)
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

  // Daily thoughts handlers (existing)
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
    // Don't show countdown for all-day tasks
    if (dueTime === '00:00') return null;
    
    const now = new Date();
    const [year, month, day] = dueDate.split('-').map(Number);
    const [hours, minutes] = dueTime.split(':').map(Number);
    const dueDateTime = new Date(year, month - 1, day, hours, minutes);
    
    const diffMs = dueDateTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 0) {
      // Overdue
      const overdueMins = Math.abs(diffMinutes);
      const overdueHours = Math.floor(overdueMins / 60);
      const remainingMins = overdueMins % 60;
      
      if (overdueHours > 0) {
        return `Overdue by ${overdueHours}h ${remainingMins}m`;
      } else {
        return `Overdue by ${overdueMins}m`;
      }
    } else {
      // Due in future
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      
      if (hours > 0) {
        return `Due in ${hours}h ${mins}m`;
      } else {
        return `Due in ${mins}m`;
      }
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

  const formatDueDateTime = (date: string, time?: string) => {
    // Handle missing time (fallback)
    if (!time) return 'Due Today';
    
    // Check if this is an all-day task (time is 00:00)
    const isAllDay = time === '00:00';
    
    // Parse date
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    // For all-day tasks, show only the date without time
    if (isAllDay) {
      if (date === today) {
        return null; // Don't show text for all-day tasks in Today view
      } else {
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
    }
    
    // For timed tasks, show date + time
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
              <span className="text-2xl font-bold">{completedToday + completedTasks}/{totalHabits + totalTasks}</span>
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

      {/* Today's Tasks - MOVED TO FIRST */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Today's Tasks</h2>
              <p className="text-sm text-gray-500">{completedTasks} of {totalTasks} completed</p>
            </div>
          </div>

          <div className="today-tasks-list">
            {tasks.map((task) => {
              const category = getCategoryById(task.category);
              const isOverdue = task.status !== 'completed' && task.dueDate < today;
              const isCompleted = task.status === 'completed';
              const countdownText = getCountdownText(task.dueDate, task.dueTime);
              
              return (
                <div 
                  key={task.id} 
                  className={`task-row ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                  style={{ 
                    '--task-color': task.color,
                    borderLeftColor: task.color 
                  } as React.CSSProperties}
                >
                  <div className="task-main-row">
                    <div className="task-main-content">
                      <div className="task-checkbox-container">
                        <input
                          type="checkbox"
                          id={`task-${task.id}`}
                          className="task-checkbox"
                          checked={isCompleted}
                          onChange={() => onToggleTaskCompletion(task.id)}
                          style={{ accentColor: task.color }}
                        />
                      </div>
                      
                      <div className="task-info">
                        <label htmlFor={`task-${task.id}`} className="task-name">
                          {task.name}
                        </label>
                        <span className="task-category">{category?.name || 'Uncategorized'}</span>
                        {task.description && task.description.trim() && (
                          <p className="task-description">{task.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="task-details">
                      <div className="task-due-time">
                        <Clock className="w-4 h-4" />
                        {formatDueDateTime(task.dueDate, task.dueTime) && (
                          <span className="due-time-text">
                            {formatDueDateTime(task.dueDate, task.dueTime)}
                          </span>
                        )}
                      </div>
                      {countdownText && (
                        <div className={`task-countdown ${isOverdue ? 'overdue' : ''}`}>
                          {isOverdue ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span className="countdown-text">{countdownText}</span>
                        </div>
                      )}
                    </div>

                    <div className="task-actions">
                      <button
                        onClick={() => handleToggleTaskNote(task.id)}
                        className={`notes-btn ${hasTaskNote(task.id) ? 'has-note' : ''}`}
                        style={{ 
                          backgroundColor: hasTaskNote(task.id) ? task.color : undefined,
                          color: hasTaskNote(task.id) ? 'white' : undefined
                        }}
                        title={hasTaskNote(task.id) ? 'Edit note' : 'Add note'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Note Section */}
                  {activeNoteTask === task.id && (
                    <div className="task-note-section">
                      <textarea
                        value={taskNoteText}
                        onChange={(e) => setTaskNoteText(e.target.value)}
                        placeholder="Add a note about this task today..."
                        className="task-note-input"
                        autoFocus
                      />
                      <div className="note-actions">
                        <button
                          onClick={() => handleSaveTaskNote(task.id)}
                          className="save-note-btn"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelTaskNote}
                          className="cancel-note-btn"
                        >
                          <X className="w-3 h-3 mr-1" />
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

      {/* Today's Habits - MOVED TO SECOND */}
      {habits.length > 0 && (
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
            {habits.map((habit) => {
              const weeklyRate = getCompletionRate(habit, 'week');
              const monthlyRate = getCompletionRate(habit, 'month');
              const category = getCategoryById(habit.category);
              
              return (
                <div 
                  key={habit.id} 
                  className={`habit-row ${habit.isCompletedToday ? 'completed' : ''}`}
                  style={{ 
                    '--habit-color': habit.color,
                    borderLeftColor: habit.color 
                  } as React.CSSProperties}
                >
                  <div className="habit-main-row">
                    <div className="habit-main-content">
                      <div className="habit-checkbox-container">
                        <input
                          type="checkbox"
                          id={`habit-${habit.id}`}
                          className="habit-checkbox"
                          checked={habit.isCompletedToday}
                          onChange={() => onToggleCompletion(habit.id)}
                          style={{ accentColor: habit.color }}
                        />
                      </div>
                      
                      <div className="habit-info">
                        <label htmlFor={`habit-${habit.id}`} className="habit-name">
                          {habit.name}
                        </label>
                        <span className="habit-category">{category?.name || 'Uncategorized'}</span>
                        {habit.description && habit.description.trim() && (
                          <p className="habit-description">{habit.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="habit-stats">
                      <div className={`stat-item ${habit.currentStreak >= 7 ? 'current-streak' : ''}`}>
                        <span className="stat-value">{habit.currentStreak}</span>
                        <span className="stat-label">Streak</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{weeklyRate}%</span>
                        <span className="stat-label">Week</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">{monthlyRate}%</span>
                        <span className="stat-label">Month</span>
                      </div>
                    </div>
                  
                  <div className="habit-actions">
                    <button
                      onClick={() => handleToggleNote(habit.id)}
                      className={`notes-btn ${hasNote(habit.id) ? 'has-note' : ''}`}
                      style={{ 
                        backgroundColor: hasNote(habit.id) ? habit.color : undefined,
                        color: hasNote(habit.id) ? 'white' : undefined
                      }}
                      title={hasNote(habit.id) ? 'Edit note' : 'Add note'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                  
                  {/* Note Section */}
                  {activeNoteHabit === habit.id && (
                    <div className="habit-note-section">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note about this habit today..."
                        className="habit-note-input"
                        autoFocus
                      />
                      <div className="note-actions">
                        <button
                          onClick={() => handleSaveNote(habit.id)}
                          className="save-note-btn"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelNote}
                          className="cancel-note-btn"
                        >
                          <X className="w-3 h-3 mr-1" />
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

      {/* Daily Thoughts Section */}
      <div className="daily-thoughts-section">
        <div className="section-header">
          <h3 className="section-title">Daily Thoughts</h3>
          <span className="section-subtitle">How did today go overall?</span>
        </div>
        
        {isEditingThoughts ? (
          <div className="thoughts-input-container">
            <textarea
              value={dailyThoughtsText}
              onChange={(e) => setDailyThoughtsText(e.target.value)}
              placeholder="Reflect on your day, challenges, wins, or anything else..."
              className="daily-thoughts-input"
              autoFocus
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
          <p className="text-green-600">You've completed all your habits and tasks for today. Outstanding work!</p>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        /* TODAY TAB - IMPROVED LIST FORMAT */
        .today-habits-list, .today-tasks-list {
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
          cursor: pointer;
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

        .habit-row.completed .habit-name, .task-row.completed .task-name {
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
          transform: scale(1.1);
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
          cursor: pointer;
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
          color: var(--habit-color);
          font-size: 16px;
        }

        .stat-item.current-streak::before {
          content: '🔥 ';
          font-size: 12px;
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
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
        }

        .due-time-text {
          font-weight: 500;
        }

        .task-priority {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .priority-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .priority-text {
          font-weight: 500;
          text-transform: capitalize;
        }

        .habit-actions {
          display: flex;
          gap: 8px;
          margin-left: 24px;
          flex-shrink: 0;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          margin-left: 24px;
          flex-shrink: 0;
        }

        .notes-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f3f4f6;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .notes-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .notes-btn.has-note {
          background: var(--habit-color);
          color: white;
        }

        .habit-note-section {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .habit-note-input {
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

        .habit-note-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .note-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-note-btn, .cancel-note-btn {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-note-btn {
          background: #3b82f6;
          color: white;
        }

        .save-note-btn:hover {
          background: #2563eb;
        }

        .cancel-note-btn {
          background: #e5e7eb;
          color: #374151;
        }

        .cancel-note-btn:hover {
          background: #d1d5db;
        }

        .daily-thoughts-section {
          margin-top: 40px;
          padding: 24px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          font-size: 14px;
          color: #6b7280;
        }

        .daily-thoughts-input {
          width: 100%;
          min-height: 100px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          line-height: 1.5;
          resize: vertical;
          margin-bottom: 12px;
          transition: border-color 0.2s ease;
        }

        .daily-thoughts-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .thoughts-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .save-thoughts-btn, .cancel-thoughts-btn {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
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
        /* Countdown Timer Styling */
        .task-countdown {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #10b981;
          font-weight: 500;
          padding: 2px 6px;
          background: #ecfdf5;
          border-radius: 4px;
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

        /* Task Note Section */
        .task-note-section {
          margin-top: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .task-note-input {
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

        .task-note-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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