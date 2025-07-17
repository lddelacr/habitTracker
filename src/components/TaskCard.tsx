import React, { useState } from 'react';
import { Calendar, Edit3, Trash2, CheckCircle2, Clock, AlertTriangle, Circle, MapPin } from 'lucide-react';
import { Task } from '../types/task';
import { getCategoryById } from '../utils/categoryUtils';
import { getTodayString } from '../utils/dateUtils';

// Helper function to determine if a task is effectively completed
const isTaskEffectivelyCompleted = (task: Task): boolean => {
  // If manually completed, always return true
  if (task.status === 'completed') return true;
  
  // If it's an event, check if it has passed
  if (task.type === 'event') {
    const now = new Date();
    
    // FIXED: Parse date string properly to avoid timezone issues
    // Use the same pattern as the rest of the codebase
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    
    // Use end time if available, otherwise use due time
    const eventTime = task.endTime || task.dueTime;
    const [hours, minutes] = eventTime.split(':').map(Number);
    
    // Set the event end time
    const eventEndTime = new Date(eventDate);
    eventEndTime.setHours(hours, minutes, 0, 0);
    
    return now > eventEndTime;
  }
  
  return false;
};

interface TaskCardProps {
  task: Task;
  onToggleCompletion?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleCompletion,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const category = getCategoryById(task.category);
  const categoryName = category?.name || 'Uncategorized';
  const isEvent = task.type === 'event';
  
  const today = getTodayString();
  const isOverdue = task.status !== 'completed' && task.dueDate < today;
  const isCompleted = isTaskEffectivelyCompleted(task);

  const formatDueDateTime = (dateString: string, timeString: string, endTimeString?: string) => {
    // Check if this is an all-day item
    const isAllDay = timeString === '00:00';
    
    // Parse date string directly without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    const todayString = getTodayString();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    // For all-day items, show only the date without time
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
    
    // For timed items, format time range for events or single time for tasks
    if (isEvent && endTimeString && endTimeString !== timeString) {
      // Event with duration - show time range
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
      };
      
      const startTime = formatTime(timeString);
      const endTime = formatTime(endTimeString);
      const timeRange = `${startTime} - ${endTime}`;
      
      if (dateString === todayString) {
        return `Today ${timeRange}`;
      } else if (dateString === tomorrowString) {
        return `Tomorrow ${timeRange}`;
      } else {
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: year !== today.getFullYear() ? 'numeric' : undefined
        });
        return `${dateStr} ${timeRange}`;
      }
    } else {
      // Single time for tasks or events without end time
      const [hours, minutes] = timeString.split(':').map(Number);
      const period = hours >= 12 ? 'pm' : 'am';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
      
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
      className={`task-card ${isEvent ? 'event-card' : ''} ${isCompleted ? 'completed' : ''} ${isHovered ? 'hover-preview' : ''}`}
      style={{ 
        '--task-color': task.color,
        borderLeftColor: task.color 
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="task-header">
        <div className="task-info">
          <div className="task-title-row">
            <h3 className="task-name">{task.name}</h3>
            {/* Status/Completion Indicator */}
            <div 
              className="task-completion-integrated"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {!isEvent && onToggleCompletion ? (
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
                <div className={`status-circle ${isEvent ? 'event-status' : ''}`}>
                  {isEvent ? (
                    <Calendar className="w-5 h-5" style={{ color: task.color }} />
                  ) : isCompleted ? (
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
          
          <div className="item-meta">
            <span className="item-category">
              {categoryName}
            </span>
            {task.description && task.description.trim() && (
              <p className="item-description">{task.description}</p>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="task-actions">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="edit-btn"
                title={`Edit ${isEvent ? 'event' : 'task'}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="delete-btn"
                title={`Delete ${isEvent ? 'event' : 'task'}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="task-details">
        {/* For Events: Two-column layout */}
        {isEvent ? (
          <div className="event-details-grid">
            <div className="event-time-column">
              <div className="task-due-date">
                <Clock className="w-4 h-4" />
                <span className="due-date-text">
                  {formatDueDateTime(task.dueDate, task.dueTime, task.endTime)}
                </span>
              </div>
            </div>
            {task.location && (
              <div className="event-location-column">
                <div className="event-location">
                  <MapPin className="w-4 h-4" />
                  <span className="location-text">{task.location}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* For Tasks: Original layout */
          <div className="task-due-date">
            <Calendar className="w-4 h-4" />
            <span className="due-date-text">
              {formatDueDateTime(task.dueDate, task.dueTime, task.endTime)}
            </span>
          </div>
        )}
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
          height: 180px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          margin-bottom: 8px;
          overflow: hidden;
          word-wrap: break-word;
        }

        .task-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .task-card.event-card {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
          border-left-width: 4px;
        }

        .task-card.completed {
          background: #f9fafb;
          opacity: 0.85;
        }

        .task-card.completed .task-name {
          text-decoration: line-through;
          color: #6b7280;
        }

        .task-card.overdue {
          border-left-color: #f59e0b;
          border-left-width: 6px;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
        }

        .task-card.overdue .due-date-text.overdue {
          color: #f59e0b;
          font-weight: 600;
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

        .task-card.hover-preview .item-description {
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

        .task-card.completed.hover-preview .item-description {
          color: #6b7280;
          text-decoration: none;
        }

        /* Header */
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .task-info {
          flex: 1;
          min-width: 0;
          max-width: calc(100% - 80px);
          overflow: hidden;
        }

        .task-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
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
          max-width: calc(100% - 48px);
          transition: all 0.2s ease;
        }

        /* Status/Completion Icons */
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
          /* Removed transform: scale(1.05) to prevent cutoff */
        }

        .status-circle {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .status-circle.event-status {
          color: var(--task-color);
        }

        /* Meta Information */
        .item-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-category {
          font-size: 13px;
          color: var(--task-color);
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
          display: inline-block;
          width: fit-content;
          position: relative;
          overflow: hidden;
          margin-bottom: 2px;
          border: 1px solid var(--task-color);
          background: white !important;
        }

        .item-category::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--task-color);
          opacity: 0.12;
          z-index: -1;
        }

        .item-description {
          font-size: 13px;
          color: #9ca3af;
          margin: 0;
          margin-top: 2px;
          line-height: 1.4;
          font-style: italic;
          opacity: 0.9;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          white-space: normal;
          max-width: 100%;
          word-wrap: break-word;
          transition: all 0.2s ease;
        }

        /* Actions */
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

        /* Details Section */
        .task-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden;
          width: 100%;
        }

        /* Event Grid Layout */
        .event-details-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          width: 100%;
        }

        .event-time-column {
          flex: 1;
          min-width: 0;
        }

        .event-location-column {
          flex: 0 0 auto;
          max-width: 50%;
          min-width: 0;
        }

        .task-due-date {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
          max-width: 100%;
          overflow: hidden;
        }

        .task-due-date .w-4 {
          flex-shrink: 0;
        }

        .due-date-text {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
          color: #6b7280;
          transition: color 0.2s ease;
        }

        /* Event-specific Details */
        .event-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #6b7280;
          max-width: 100%;
          overflow: hidden;
        }

        .event-location .w-4 {
          flex-shrink: 0;
        }

        .location-text {
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .task-card {
            height: auto;
            min-height: 160px;
            padding: 16px;
          }

          .task-name {
            font-size: 16px;
          }

          .task-details {
            gap: 4px;
          }

          .task-due-date {
            font-size: 13px;
          }

          .task-actions {
            margin-left: 0;
            margin-top: 8px;
          }

          .event-location {
            font-size: 12px;
          }

          .item-category {
            font-size: 12px;
            padding: 3px 6px;
          }

          .item-description {
            font-size: 12px;
            -webkit-line-clamp: 1;
          }

          .item-meta {
            gap: 3px;
          }

          .task-header {
            margin-bottom: 6px;
          }

          /* Stack event details on mobile */
          .event-details-grid {
            flex-direction: column;
            gap: 6px;
          }

          .event-location-column {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};