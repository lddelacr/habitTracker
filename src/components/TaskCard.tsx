import React, { useState } from 'react';
import { Calendar, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle, Circle } from 'lucide-react';
import { Task } from '../types/task';
import { getCategoryById } from '../utils/categoryUtils';
import { getTodayString } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onToggleCompletion?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  showUrgentStyling?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleCompletion,
  onEdit,
  onDelete,
  showActions = false,
  showUrgentStyling = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const category = getCategoryById(task.category);
  const categoryName = category?.name || 'Uncategorized';
  
  const today = getTodayString();
  const isOverdue = task.status !== 'completed' && task.dueDate < today;
  const isCompleted = task.status === 'completed';

  const formatDueDateTime = (dateString: string, timeString: string) => {
    // Check if this is an all-day task (time is 00:00)
    const isAllDay = timeString === '00:00';
    
    // Parse date string directly without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    const todayString = getTodayString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    // For all-day tasks, show only the date without time
    if (isAllDay) {
      if (dateString === todayString) {
        return 'Today';
      } else if (dateString === tomorrowString) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: year !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    }
    
    // For timed tasks, show date + time
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    
    if (dateString === todayString) {
      return `Today at ${formattedTime}`;
    } else if (dateString === tomorrowString) {
      return `Tomorrow at ${formattedTime}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: year !== today.getFullYear() ? 'numeric' : undefined
      });
      return `${dateStr} at ${formattedTime}`;
    }
  };

  // Helper function to get lighter background color for completed tasks
  const getCompletedBackgroundColor = (color: string) => {
    // Convert hex to RGB and apply low opacity
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.1)`;
    }
    // Fallback for non-hex colors
    return `${color}20`;
  };

  return (
    <div 
      className={`task-card ${isCompleted ? 'completed' : ''} ${isHovered ? 'hover-preview' : ''}`}
      style={{ 
        '--task-color': task.color,
        borderLeftColor: task.color 
      } as React.CSSProperties}
    >
      {/* Task Header */}
      <div className="task-header">
        <div className="task-info">
          <div className="task-title-row">
            <h3 className={`task-name ${showUrgentStyling ? 'urgent' : ''}`}>{task.name}</h3>
            {/* Integrated Completion Circle with Hover */}
            <div 
              className="task-completion-integrated"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {onToggleCompletion ? (
                <button
                  onClick={() => onToggleCompletion(task.id)}
                  className={`completion-circle ${isCompleted ? 'completed' : ''} ${isHovered && !isCompleted ? 'hover-preview' : ''}`}
                  title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                  style={{ 
                    borderColor: isHovered && !isCompleted ? task.color : task.color,
                    backgroundColor: isHovered && !isCompleted ? `${task.color}20` : isCompleted ? getCompletedBackgroundColor(task.color) : 'white'
                  }}
                >
                  {/* Show appropriate icon based on hover and completion state */}
                  {isHovered && !isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: task.color }} />
                  ) : isHovered && isCompleted ? (
                    <Circle className="w-5 h-5" style={{ color: task.color }} />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: task.color }} />
                  ) : (
                    <Circle className="w-5 h-5" style={{ color: task.color }} />
                  )}
                </button>
              ) : (
                <div className="status-circle">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: task.color }} />
                  ) : isOverdue ? (
                    <AlertTriangle className="w-5 h-5" style={{ color: '#dc2626' }} />
                  ) : (
                    <Circle className="w-5 h-5" style={{ color: task.color }} />
                  )}
                </div>
              )}
            </div>
          </div>
          <span className="task-category">{categoryName}</span>
          {task.description && task.description.trim() && (
            <p className="task-description">{task.description}</p>
          )}
        </div>
        {showActions && (
          <div className="task-actions">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="edit-btn"
                title="Edit task"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="delete-btn"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Details - Only Due Date/Time */}
      <div className="task-details">
        <div className="task-due-date">
          <Calendar className="w-4 h-4" />
          <span className={`due-date-text ${isOverdue ? 'overdue' : ''}`}>
            {formatDueDateTime(task.dueDate, task.dueTime)}
          </span>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .task-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-left: 4px solid var(--task-color);
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          margin-bottom: 8px;
        }

        .task-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        /* Completed tasks styling */
        .task-card.completed {
          background: #f9fafb;
          opacity: 0.85;
        }

        .task-card.completed .task-name {
          text-decoration: line-through;
          color: #6b7280;
        }

        .task-card.completed .task-description {
          text-decoration: line-through;
          color: #9ca3af;
        }

        /* Hover preview effect */
        .task-card.hover-preview {
          background: #f9fafb;
          transition: background-color 0.2s ease;
        }

        .task-card.hover-preview .task-name {
          color: #6b7280;
          text-decoration: line-through;
          text-decoration-color: #9ca3af;
          transition: all 0.2s ease;
        }

        .task-card.hover-preview .task-description {
          color: #9ca3af;
          text-decoration: line-through;
          text-decoration-color: #d1d5db;
          transition: all 0.2s ease;
        }

        /* Reverse effect for completed tasks */
        .task-card.completed.hover-preview .task-name {
          color: #1f2937;
          text-decoration: none;
        }

        .task-card.completed.hover-preview .task-description {
          color: #6b7280;
          text-decoration: none;
        }

        /* Task Header */
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .task-info {
          flex: 1;
          min-width: 0;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .task-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          margin-right: 16px;
          transition: all 0.2s ease;
        }

        .task-name.urgent {
          color: #dc2626;
        }

        /* Hover preview should override urgent color */
        .task-card.hover-preview .task-name.urgent {
          color: #6b7280;
        }

        /* Integrated Completion Circle */
        .task-completion-integrated {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          cursor: pointer;
        }

        .completion-circle {
          width: 32px;
          height: 32px;
          border: 2px solid;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .completion-circle:hover {
          transform: scale(1.05);
        }

        .status-circle {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .task-category {
          font-size: 13px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
          display: inline-block;
          margin-bottom: 8px;
        }

        .task-description {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
          line-height: 1.4;
          font-style: italic;
          opacity: 0.9;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          white-space: normal;
          transition: all 0.2s ease;
        }

        .task-actions {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }

        .edit-btn, .delete-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: #f9fafb;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #6b7280;
        }

        .edit-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Task Details - Simplified */
        .task-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }

        .task-due-date {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }

        .due-date-text {
          transition: color 0.2s ease;
          color: #6b7280;
        }

        .due-date-text.overdue {
          color: #dc2626;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
