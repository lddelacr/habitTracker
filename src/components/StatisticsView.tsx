import React from 'react';
import { BarChart3, TrendingUp, Target, Flame, Calendar, Award, Trophy, Star, CheckSquare } from 'lucide-react';
import { Habit, HabitStats } from '../types/habit';
import { Task, TaskStats } from '../types/task';
import { getCompletionRate } from '../utils/dateUtils';
import { getCategoryById } from '../utils/categoryUtils';

interface StatisticsViewProps {
  habits: Habit[];
  stats: HabitStats;
  tasks: Task[];
  taskStats: TaskStats;
}

// Circular progress component
const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string }> = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  color = '#10B981'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            animation: 'progress-fill 1.5s ease-out'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-800">{percentage}%</span>
      </div>
    </div>
  );
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ habits, stats, tasks, taskStats }) => {
  const sortedByStreak = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);
  const sortedByCompletion = [...habits].sort((a, b) => 
    getCompletionRate(b, 'month') - getCompletionRate(a, 'month')
  );

  const sortedTasksByDate = [...tasks].sort((a, b) => {
    // Sort by due date, then by completion status
    if (a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }
    // Completed tasks go to bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (b.status === 'completed' && a.status !== 'completed') return -1;
    return 0;
  });
  // Get completion rate color
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return '#10B981'; // Green
    if (rate >= 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  // Get streak flame color based on length
  const getStreakFlameColor = (streak: number) => {
    if (streak >= 30) return '#F59E0B'; // Gold
    if (streak >= 14) return '#EF4444'; // Red-orange
    if (streak >= 7) return '#F97316'; // Orange
    return '#6B7280'; // Gray
  };

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = 'blue',
    showProgress = false,
    progressValue = 0
  }: { 
    icon: React.ComponentType<{ className?: string }>, 
    title: string, 
    value: string | number, 
    subtitle: string,
    color?: string,
    showProgress?: boolean,
    progressValue?: number
  }) => {
    const colorClasses = {
      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-600',
      green: 'from-green-50 to-green-100 border-green-200 text-green-600',
      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-600',
      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-600',
      gold: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-600',
      red: 'from-red-50 to-red-100 border-red-200 text-red-600'
    };

    const getCardColor = () => {
      if (color === 'completion') {
        const rate = typeof value === 'string' ? parseInt(value) : value;
        if (rate >= 80) return colorClasses.green;
        if (rate >= 60) return colorClasses.orange;
        return colorClasses.red;
      }
      return colorClasses[color] || colorClasses.blue;
    };

    return (
      <div className={`bg-gradient-to-br ${getCardColor()} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
        <div className="flex items-center justify-between mb-6">
          <div className="p-4 bg-white bg-opacity-50 rounded-xl">
            <Icon className="w-8 h-8" />
          </div>
          {showProgress && (
            <CircularProgress 
              percentage={progressValue} 
              size={60} 
              strokeWidth={6}
              color={getCompletionRateColor(progressValue)}
            />
          )}
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          <p className="text-lg font-semibold text-gray-700">{title}</p>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes progress-fill {
          from {
            stroke-dasharray: 0 1000;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Statistics</h1>
          <p className="text-gray-600">Your habit tracking insights</p>
        </div>
      </div>

      {/* Enhanced Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-fade-in-up">
        <StatCard
          icon={Target}
          title="Total Habits"
          value={stats.totalHabits}
          subtitle="Active habits"
          color="blue"
        />
        <StatCard
          icon={CheckSquare}
          title="Total Tasks"
          value={taskStats.totalTasks}
          subtitle="All tasks"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="Completion Rate"
          value={`${stats.averageCompletionRate}%`}
          subtitle="This month (elapsed days)"
          color="completion"
          showProgress={true}
          progressValue={stats.averageCompletionRate}
        />
        <StatCard
          icon={Award}
          title="Longest Streak"
          value={stats.longestStreak}
          subtitle="Days in a row"
          color="gold"
        />
        <StatCard
          icon={Flame}
          title="Active Streaks"
          value={stats.currentActiveStreaks}
          subtitle="Currently running"
          color="purple"
        />
      </div>

      {/* Enhanced Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Top Performers */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            Top Performers
            <span className="text-sm font-normal text-gray-500 ml-auto">This Month</span>
          </h2>
          <div className="space-y-4">
            {sortedByCompletion.slice(0, 5).map((habit, index) => {
              const rate = getCompletionRate(habit, 'month');
              const getRankBadge = (rank: number) => {
                const badges = {
                  0: { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', icon: '👑', text: 'text-yellow-900' },
                  1: { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', icon: '🥈', text: 'text-gray-700' },
                  2: { bg: 'bg-gradient-to-r from-orange-400 to-orange-500', icon: '🥉', text: 'text-orange-900' },
                };
                return badges[rank] || { bg: 'bg-blue-100', icon: `${rank + 1}`, text: 'text-blue-700' };
              };

              const badge = getRankBadge(index);
              
              return (
                <div key={habit.id} className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 ${badge.bg} rounded-full flex items-center justify-center text-sm font-bold ${badge.text} shadow-md`}>
                        {badge.icon}
                      </div>
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-gray-900">{habit.name}</p>
                        <p className="text-sm text-gray-500">{getCategoryById(habit.category)?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{rate}%</p>
                      {rate === 100 && <Star className="w-4 h-4 text-yellow-500 mx-auto" />}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${rate}%`,
                        background: `linear-gradient(90deg, ${habit.color}, ${habit.color}dd)`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Overview */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            Task Overview
          </h2>
          <div className="space-y-4">
            {/* Task Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{taskStats.completedTasks}</p>
                <p className="text-sm text-green-700">Completed</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{taskStats.overdueTasks}</p>
                <p className="text-sm text-red-700">Overdue</p>
              </div>
            </div>
            
            {/* Recent Tasks */}
            {sortedTasksByDate.slice(0, 5).map((task) => {
              const category = getCategoryById(task.category);
              const isOverdue = task.status !== 'completed' && task.dueDate < new Date().toISOString().split('T')[0];
              
              return (
                <div key={task.id} className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: task.color }}
                      />
                      <div>
                        <p className={`font-semibold text-gray-800 group-hover:text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                          {task.name}
                        </p>
                        <p className="text-sm text-gray-500">{category?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs mt-1 ${
                        task.status === 'completed' ? 'text-green-600' : 
                        isOverdue ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {task.status === 'completed' ? 'Completed' : 
                         isOverdue ? 'Overdue' : 
                         new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Enhanced Current Streaks */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            Current Streaks
          </h2>
          <div className="space-y-4">
            {sortedByStreak.slice(0, 5).map((habit) => {
              const streakColor = getStreakFlameColor(habit.currentStreak);
              const getStreakIcon = (streak: number) => {
                if (streak >= 30) return <Trophy className="w-6 h-6" style={{ color: streakColor }} />;
                if (streak >= 7) return <Flame className="w-6 h-6" style={{ color: streakColor }} />;
                return <Flame className="w-5 h-5 text-gray-300" />;
              };

              return (
                <div key={habit.id} className="group p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStreakIcon(habit.currentStreak)}
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: habit.color }}
                      />
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-gray-900">{habit.name}</p>
                        <p className="text-sm text-gray-500">{getCategoryById(habit.category)?.name || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-800">{habit.currentStreak}</p>
                      <p className="text-sm text-gray-500">
                        {habit.currentStreak === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                  {habit.currentStreak > 0 && (
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${Math.min((habit.currentStreak / 30) * 100, 100)}%`,
                          backgroundColor: streakColor
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhanced Weekly Overview */}
      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          This Week's Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map(habit => {
            const weeklyRate = getCompletionRate(habit, 'week');
            const getPerformanceColor = (rate: number) => {
              if (rate >= 80) return '#10B981';
              if (rate >= 60) return '#F59E0B';
              return '#EF4444';
            };

            return (
              <div key={habit.id} className="group p-6 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all duration-200 hover:shadow-md bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: habit.color }}
                    />
                    <h3 className="font-semibold text-gray-800 truncate group-hover:text-gray-900">{habit.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold" style={{ color: getPerformanceColor(weeklyRate) }}>
                      {weeklyRate}%
                    </span>
                    {weeklyRate === 100 && <Star className="w-4 h-4 text-yellow-500" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className="h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ 
                        width: `${weeklyRate}%`,
                        background: `linear-gradient(90deg, ${getPerformanceColor(weeklyRate)}, ${getPerformanceColor(weeklyRate)}dd)`
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {weeklyRate >= 80 ? '🎉 Excellent!' : 
                     weeklyRate >= 60 ? '👍 Good progress' : 
                     '💪 Keep going!'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};