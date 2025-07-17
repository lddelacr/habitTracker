import React, { useState } from 'react';
import { Calendar, Target, BarChart3, CalendarDays, Menu, X, CheckSquare } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { UserMenu } from './components/UserMenu';
import { useHabits } from './hooks/useHabits';
import { useTasks } from './hooks/useTasks';
import { TodayView } from './components/TodayView';
import { HabitsView } from './components/HabitsView';
import { TasksView } from './components/TasksView';
import { StatisticsView } from './components/StatisticsView';
import { CalendarView } from './components/CalendarView';

type View = 'today' | 'habits' | 'tasks' | 'calendar' | 'stats';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const {
    habits,
    selectedCategory,
    setSelectedCategory,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    toggleHabitCompletionForDate,
    getTodayHabits,
    getHabitStats,
    saveHabitNote,
    getHabitNote,
    saveTaskNote,
    getTaskNote,
    saveDailyThoughts,
    getDailyThoughts,
    isLoading: habitsLoading,
    error: habitsError
  } = useHabits();

  const {
    tasks,
    selectedCategory: selectedTaskCategory,
    selectedStatus,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    getFilteredTasks,
    getTodayTasks,
    getTaskStats,
    isLoading: tasksLoading,
    error: tasksError
  } = useTasks();

  const [currentView, setCurrentView] = useState<View>('today');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading HabitFlow..." />
      </div>
    );
  }

  // Show auth page if user is not logged in
  if (!user) {
    return <AuthPage />;
  }

  const todayHabits = getTodayHabits();
  const todayTasks = getTodayTasks();
  const stats = getHabitStats();
  const taskStats = getTaskStats();

  const navigationItems = [
    { id: 'today' as View, label: 'Today', icon: Calendar },
    { id: 'habits' as View, label: 'Habits', icon: Target },
    { id: 'tasks' as View, label: 'Tasks & Events', icon: CheckSquare },
    { id: 'calendar' as View, label: 'Calendar', icon: CalendarDays },
    { id: 'stats' as View, label: 'Statistics', icon: BarChart3 },
  ];

  const renderCurrentView = () => {
    if (habitsLoading || tasksLoading) {
      return <LoadingSpinner size="lg" text="Loading your data..." />;
    }

    if (habitsError || tasksError) {
      return (
        <div className="text-center py-16">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">{habitsError || tasksError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'today':
        return (
          <TodayView
            habits={todayHabits}
            tasks={todayTasks}
            onToggleCompletion={toggleHabitCompletion}
            onToggleTaskCompletion={toggleTaskCompletion}
            saveHabitNote={saveHabitNote}
            getHabitNote={getHabitNote}
            saveTaskNote={saveTaskNote}
            getTaskNote={getTaskNote}
            saveDailyThoughts={saveDailyThoughts}
            getDailyThoughts={getDailyThoughts}
          />
        );
      case 'habits':
        return (
          <HabitsView
            habits={habits}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onAddHabit={addHabit}
            onUpdateHabit={updateHabit}
            onDeleteHabit={deleteHabit}
            onToggleCompletion={toggleHabitCompletion}
          />
        );
      case 'tasks':
        return (
          <TasksView
            tasks={getFilteredTasks()}
            selectedCategory={selectedTaskCategory}
            selectedPriority=""
            selectedStatus={selectedStatus}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onToggleCompletion={toggleTaskCompletion}
          />
        );
    case 'calendar':
      return (
        <CalendarView
          habits={habits}
          tasks={tasks}
          onToggleCompletion={toggleHabitCompletion}
          onToggleCompletionForDate={toggleHabitCompletionForDate}
          onToggleTaskCompletion={toggleTaskCompletion}
          getHabitNote={getHabitNote}
          saveHabitNote={saveHabitNote}
          getTaskNote={getTaskNote}
          saveTaskNote={saveTaskNote}
          getDailyThoughts={getDailyThoughts}
          saveDailyThoughts={saveDailyThoughts}
        />
      );
      case 'stats':
        return (
          <StatisticsView
            habits={habits}
            stats={stats}
            tasks={tasks}
            taskStats={taskStats}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold text-gray-800">HabitFlow</h1>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mt-4 pb-4 border-t border-gray-100 pt-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-60 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <Target className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-800">HabitFlow</h1>
            </div>

            <nav className="space-y-2 mb-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User Menu in Sidebar */}
            <div className="border-t border-gray-100 pt-4">
              <UserMenu />
            </div>
          </div>

          {/* Quick Stats in Sidebar */}
          {!habitsLoading && !tasksLoading && (
            <div className="px-6 py-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Habits</span>
                  <span className="font-medium text-gray-800">{stats.totalHabits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-medium text-gray-800">{stats.averageCompletionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Streaks</span>
                  <span className="font-medium text-gray-800">{stats.currentActiveStreaks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-medium text-gray-800">{taskStats.totalTasks}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className={`h-full ${currentView === 'calendar' ? 'calendar-view-container' : 'p-4 lg:p-8'}`}>
            <div className={currentView === 'calendar' ? 'h-full' : 'max-w-6xl mx-auto'}>
              {renderCurrentView()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <style jsx global>{`
        /* Calendar-specific layout styles */
        .calendar-view-container {
          height: 100vh;
          overflow: hidden;
          padding: 0;
          margin: 0;
        }
        
        /* Ensure calendar takes remaining width after sidebar */
        .calendar-view-container .calendar-layout {
          width: calc(100vw - 240px);
          position: relative;
          left: 0;
          top: 0;
        }
        
        /* Mobile adjustments */
        @media (max-width: 1023px) {
          .calendar-view-container .calendar-layout {
            width: 100vw;
          }
        }
      `}</style>
      <AppContent />
    </AuthProvider>
  );
}

export default App;