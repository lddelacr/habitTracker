import React from 'react';
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
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleCompletion,
  onEdit,
  onDelete,
  showActions = false
}) => {
  const category = getCategoryById(task.category);
  const categoryName = category?.name || 'Uncategorized';
  
  const today = getTodayString();
  const isOverdue = task.status !== 'completed' && task.dueDate < today;
  const isDueToday = task.dueDate === today;
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

  return (
    <div 
      className={`task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
      style={{ 
        '--task-color': task.color,
        borderLeftColor: task.color 
      } as React.CSSProperties}
    >
      {/* Task Header */}
      <div className="task-header">
        <div className="task-info">
          <div className="task-title-row">
            <h3 className="task-name">{task.name}</h3>
            {/* Integrated Completion Circle */}
            <div className="task-completion-integrated">
              {onToggleCompletion ? (
                <button
                  onClick={() => onToggleCompletion(task.id)}
                  className={`completion-circle ${isCompleted ? 'completed' : ''}`}
                  title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
              ) : (
                <div className="status-circle">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : isOverdue ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-gray-400" />
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
          <span className={`due-date-text ${isDueToday ? 'due-today' : ''} ${isOverdue ? 'overdue' : ''}`}>
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
          height: 180px;
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

        .task-card.completed {
          background: #f9fafb;
          opacity: 0.85;
        }

        .task-card.completed .task-name {
          text-decoration: line-through;
          color: #6b7280;
        }

        .task-card.overdue {
          border-left-color: #ef4444;
          background: #fef2f2;
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
        }

        /* Integrated Completion Circle */
        .task-completion-integrated {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .completion-circle {
          width: 32px;
          height: 32px;
          border: 2px solid #e5e7eb;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #9ca3af;
        }

        .completion-circle:hover {
          border-color: #d1d5db;
          background: #f9fafb;
          transform: scale(1.05);
          color: #6b7280;
        }

        .completion-circle.completed {
          border-color: #10b981;
          background: #ecfdf5;
          color: #059669;
        }

        .completion-circle.completed:hover {
          border-color: #059669;
          background: #d1fae5;
          color: #047857;
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
          font-size: 14px;
          color: #6b7280;
        }

        .due-date-text {
          font-weight: 500;
        }

        .due-date-text.due-today {
          color: #f59e0b;
          font-weight: 600;
        }

        .due-date-text.overdue {
          color: #ef4444;
          font-weight: 600;
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

        .habit-actions {
          display: flex;
          gap: 8px;
          margin-left: 16px;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .task-card {
            height: auto;
            min-height: 160px;
          }

          .task-name {
            font-size: 16px;
          }

          .task-details {
            gap: 6px;
          }

          .task-due-date {
            font-size: 13px;
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
        }
      `}</style>
    </div>
  );
};