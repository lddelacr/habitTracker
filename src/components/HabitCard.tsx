import React from 'react';
import { Edit3, Trash2, CheckCircle2, Circle, Flame, Trophy } from 'lucide-react';
import { Habit } from '../types/habit';
import { getCompletionRate } from '../utils/dateUtils';
import { getCategoryById } from '../utils/categoryUtils';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday?: boolean;
  onToggleCompletion?: (id: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  showCompletion?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isCompletedToday = false,
  onToggleCompletion,
  onEdit,
  onDelete,
  showActions = false,
  showCompletion = true
}) => {
  const weeklyRate = getCompletionRate(habit, 'week');
  const monthlyRate = getCompletionRate(habit, 'month');

  // Get category information
  const category = getCategoryById(habit.category);
  const categoryName = category?.name || 'Uncategorized';

  // Check if today is a scheduled day for this habit
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[today.getDay()];
  const isScheduledToday = habit.selectedDays?.includes(todayName) || false;

  // Format frequency display
  const getFrequencyDisplay = () => {
    if (!habit.selectedDays || habit.selectedDays.length === 0) {
      return { type: 'none', display: 'No schedule' };
    }
    
    if (habit.selectedDays.length === 7) {
      return { type: 'daily', display: 'DAILY' };
    }
    
    return {
      type: 'custom',
      display: habit.selectedDays
        .map(day => day.slice(0, 3).toUpperCase())
        .join(' ')
    };
  };

  const frequency = getFrequencyDisplay();

  // Get streak styling based on milestone
  const getStreakStyling = () => {
    if (habit.currentStreak >= 30) {
      return {
        color: '#f59e0b',
        icon: <Trophy className="w-6 h-6" />,
        glow: true,
        label: 'Champion!'
      };
    } else if (habit.currentStreak >= 7) {
      return {
        color: '#ef4444',
        icon: <Flame className="w-5 h-5" />,
        glow: false,
        label: 'On Fire!'
      };
    } else if (habit.currentStreak >= 3) {
      return {
        color: '#10b981',
        icon: null,
        glow: false,
        label: 'Building momentum'
      };
    } else {
      return {
        color: '#6b7280',
        icon: null,
        glow: false,
        label: habit.currentStreak === 0 ? 'Start your streak!' : 'Keep going!'
      };
    }
  };

  const streakStyling = getStreakStyling();

  // Calculate weekly progress for progress ring
  const weeklyProgress = Math.min(weeklyRate, 100);

  return (
    <div 
      className="habit-card"
      style={{ 
        '--habit-color': habit.color,
        '--streak-color': streakStyling.color,
        borderLeftColor: habit.color 
      } as React.CSSProperties}
    >
      {/* Card Header with Completion Status */}
      <div className="habit-header">
        <div className="habit-info">
          <h3 className="habit-name">{habit.name}</h3>
          <span className="habit-category">{categoryName}</span>
        </div>
        
        <div className="header-actions">
          {/* Today's Completion Status - Most Prominent */}
          {showCompletion && isScheduledToday && onToggleCompletion && (
            <button
              onClick={() => onToggleCompletion(habit.id)}
              className={`completion-indicator ${isCompletedToday ? 'completed' : 'incomplete'}`}
              title={isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isCompletedToday ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <Circle className="w-8 h-8" />
              )}
            </button>
          )}
          
          {/* Action Buttons */}
          {showActions && (
            <div className="habit-actions">
              {onEdit && (
                <button
                  onClick={() => onEdit(habit)}
                  className="edit-btn"
                  title="Edit habit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(habit.id)}
                  className="delete-btn"
                  title="Delete habit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero Streak Section */}
      <div className="streak-hero">
        <div className="streak-main">
          <div className="streak-number-container">
            <span className={`streak-number ${streakStyling.glow ? 'glow' : ''}`}>
              {habit.currentStreak}
            </span>
            {streakStyling.icon && (
              <div className="streak-icon">
                {streakStyling.icon}
              </div>
            )}
          </div>
          <div className="streak-labels">
            <span className="streak-label">Day Streak</span>
            <span className="streak-motivation">{streakStyling.label}</span>
          </div>
        </div>
        
        {/* Weekly Progress Ring */}
        <div className="progress-ring-container">
          <svg className="progress-ring" width="60" height="60">
            <circle
              className="progress-ring-background"
              cx="30"
              cy="30"
              r="25"
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            <circle
              className="progress-ring-progress"
              cx="30"
              cy="30"
              r="25"
              fill="transparent"
              stroke={habit.color}
              strokeWidth="4"
              strokeDasharray={`${(weeklyProgress / 100) * 157} 157`}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
            />
          </svg>
          <div className="progress-ring-text">
            <span className="progress-percentage">{weeklyRate}%</span>
            <span className="progress-label">Week</span>
          </div>
        </div>
      </div>

      {/* Schedule and Secondary Stats */}
      <div className="habit-footer">
        <div className="habit-frequency">
          <div className="frequency-days">
            {frequency.type === 'daily' && (
              <span className="day-tag daily" style={{ backgroundColor: habit.color }}>
                {frequency.display}
              </span>
            )}
            {frequency.type === 'custom' && 
              habit.selectedDays?.slice(0, 4).map(day => (
                <span key={day} className="day-tag" style={{ backgroundColor: habit.color }}>
                  {day.slice(0, 3).toUpperCase()}
                </span>
              ))
            }
            {frequency.type === 'custom' && habit.selectedDays && habit.selectedDays.length > 4 && (
              <span className="day-tag more" style={{ backgroundColor: habit.color }}>
                +{habit.selectedDays.length - 4}
              </span>
            )}
            {frequency.type === 'none' && (
              <span className="day-tag inactive">{frequency.display}</span>
            )}
          </div>
        </div>
        
        <div className="secondary-stats">
          <div className="stat-item">
            <span className="stat-value">{monthlyRate}%</span>
            <span className="stat-label">Month</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{habit.bestStreak}</span>
            <span className="stat-label">Best</span>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .habit-card {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-left: 4px solid var(--habit-color);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.3s ease;
          height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          margin-bottom: 8px;
        }

        .habit-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-4px);
        }

        /* Header Section */
        .habit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .habit-info {
          flex: 1;
          min-width: 0;
        }

        .habit-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 6px 0;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .habit-category {
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 500;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Completion Indicator - Hero Element */
        .completion-indicator {
          width: 48px;
          height: 48px;
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border-radius: 50%;
          position: relative;
        }

        .completion-indicator.incomplete {
          color: #d1d5db;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
        }

        .completion-indicator.incomplete:hover {
          color: var(--habit-color);
          background: rgba(var(--habit-color-rgb, 59, 130, 246), 0.1);
          border-color: var(--habit-color);
          transform: scale(1.05);
        }

        .completion-indicator.completed {
          color: #ffffff;
          background: var(--habit-color);
          border: 2px solid var(--habit-color);
          box-shadow: 0 4px 12px rgba(var(--habit-color-rgb, 59, 130, 246), 0.3);
        }

        .completion-indicator.completed:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(var(--habit-color-rgb, 59, 130, 246), 0.4);
        }

        .habit-actions {
          display: flex;
          gap: 6px;
        }

        .edit-btn, .delete-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: #f9fafb;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #9ca3af;
        }

        .edit-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .delete-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Hero Streak Section */
        .streak-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .streak-main {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .streak-number-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .streak-number {
          font-size: 48px;
          font-weight: 800;
          color: var(--streak-color);
          line-height: 1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .streak-number.glow {
          text-shadow: 0 0 20px var(--streak-color), 0 2px 4px rgba(0, 0, 0, 0.1);
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from {
            text-shadow: 0 0 20px var(--streak-color), 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          to {
            text-shadow: 0 0 30px var(--streak-color), 0 0 40px var(--streak-color), 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        }

        .streak-icon {
          position: absolute;
          top: -8px;
          right: -8px;
          color: var(--streak-color);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .streak-labels {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .streak-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .streak-motivation {
          font-size: 12px;
          color: var(--streak-color);
          font-weight: 500;
          font-style: italic;
        }

        /* Progress Ring */
        .progress-ring-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-ring {
          transform: rotate(-90deg);
          transition: all 0.3s ease;
        }

        .progress-ring-progress {
          transition: stroke-dasharray 0.5s ease;
        }

        .progress-ring-text {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .progress-percentage {
          font-size: 14px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }

        .progress-label {
          font-size: 10px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Footer Section */
        .habit-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .habit-frequency {
          flex: 1;
        }

        .frequency-days {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .day-tag {
          background: var(--habit-color);
          color: white;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          display: inline-block;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .day-tag.daily {
          padding: 3px 8px;
        }

        .day-tag.more {
          background: #9ca3af;
        }

        .day-tag.inactive {
          background: #9ca3af;
          color: white;
        }

        .secondary-stats {
          display: flex;
          gap: 16px;
        }

        .stat-item {
          text-align: center;
          min-width: 40px;
        }

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          line-height: 1;
        }

        .stat-label {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
          display: block;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .habit-card {
            height: auto;
            min-height: 260px;
            padding: 20px;
          }

          .completion-indicator {
            width: 40px;
            height: 40px;
          }

          .streak-number {
            font-size: 36px;
          }

          .streak-hero {
            padding: 12px;
            margin-bottom: 16px;
          }

          .streak-main {
            gap: 12px;
          }

          .progress-ring-container svg {
            width: 50px;
            height: 50px;
          }

          .progress-ring-container circle {
            r: 20;
            cx: 25;
            cy: 25;
          }

          .progress-ring-progress {
            stroke-dasharray: ${(weeklyProgress / 100) * 126} 126;
            transform: rotate(-90 25 25);
          }

          .secondary-stats {
            gap: 12px;
          }

          .day-tag {
            font-size: 9px;
            padding: 2px 5px;
          }
        }
      `}</style>
    </div>
  );
};