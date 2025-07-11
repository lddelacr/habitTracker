import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import { Task } from '../types/task';
import { getTodayString } from '../utils/dateUtils';

interface TasksViewProps {
  tasks: Task[];
  selectedCategory: string;
  selectedPriority: string;
  selectedStatus: string;
  onPriorityChange: (priority: string) => void;
  onStatusChange: (status: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleCompletion: (id: string) => void;
}

type ViewMode = 'sections' | 'all-together';

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleCompletion
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());
  
  // Section collapse/expand state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    pending: false,
    overdue: false,
    completed: false
  });

  // Load collapse state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('tasks-collapsed-sections');
    if (savedState) {
      try {
        setCollapsedSections(JSON.parse(savedState));
      } catch (error) {
        console.error('Error loading collapsed sections state:', error);
      }
    }
  }, []);

  // Save collapse state to localStorage
  const toggleSectionCollapse = (section: string) => {
    const newState = {
      ...collapsedSections,
      [section]: !collapsedSections[section]
    };
    setCollapsedSections(newState);
    localStorage.setItem('tasks-collapsed-sections', JSON.stringify(newState));
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Enhanced task completion with animation
  const handleToggleCompletion = async (id: string) => {
    // Add animation class
    setAnimatingTasks(prev => new Set(prev).add(id));
    
    // Wait for animation to start
    setTimeout(() => {
      onToggleCompletion(id);
      
      // Remove animation class after completion
      setTimeout(() => {
        setAnimatingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 300);
    }, 150);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDeleteTask(id);
    }
  };

  const getTaskCounts = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    
    return { total, completed, pending, overdue };
  };

  const counts = getTaskCounts();

  // Organize tasks by sections
  const organizeTasksBySections = () => {
    // CRITICAL: Use task.status directly from database - NO recalculation
    // This ensures tasks stay in their correct sections during category updates
    const pendingTasks = filteredTasks.filter(task => 
      task.status === 'pending'
    );
    const overdueTasks = filteredTasks.filter(task => 
      task.status === 'overdue'
    );
    const completedTasks = filteredTasks.filter(task => 
      task.status === 'completed'
    );

    return {
      pending: pendingTasks,
      overdue: overdueTasks,
      completed: completedTasks
    };
  };

  const sections = organizeTasksBySections();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600">Manage your deadlines and to-dos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-600">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{counts.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">✅</span>
            <span className="text-sm font-medium text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{counts.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">⏳</span>
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-medium text-gray-600">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{counts.overdue}</p>
        </div>
      </div>

      {/* Search Only */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tasks Display */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm ? 'No tasks found' : 'No tasks yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Start organizing your work by adding your first task!'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Task
            </button>
          )}
        </div>
      ) : (
        /* Section-based Organization with Collapse/Expand */
        <div className="card-container-sections">
          {/* Pending Container Card - Always Show */}
          <div className="container-card pending-container">
            <div className="container-header" onClick={() => toggleSectionCollapse('pending')}>
              <div className="container-header-left">
                <span className="container-emoji">⏳</span>
                <h3 className="container-title">Pending ({sections.pending.length})</h3>
              </div>
              <button className="collapse-toggle" type="button">
                {collapsedSections.pending ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!collapsedSections.pending && sections.pending.length > 0 && (
              <div className="container-content">
                <div className="tasks-grid-inside-container">
                  {sections.pending.map((task) => (
                    <div
                      key={task.id}
                      className={`task-card-wrapper ${animatingTasks.has(task.id) ? 'animating' : ''}`}
                    >
                      <TaskCard
                        task={task}
                        onToggleCompletion={handleToggleCompletion}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Overdue Container Card - Always Show */}
          <div className="container-card overdue-container">
            <div className="container-header" onClick={() => toggleSectionCollapse('overdue')}>
              <div className="container-header-left">
                <span className="container-emoji">⚠️</span>
                <h3 className="container-title">Overdue ({sections.overdue.length})</h3>
              </div>
              <button className="collapse-toggle" type="button">
                {collapsedSections.overdue ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!collapsedSections.overdue && sections.overdue.length > 0 && (
              <div className="container-content">
                <div className="tasks-grid-inside-container">
                  {sections.overdue.map((task) => (
                    <div
                      key={task.id}
                      className={`task-card-wrapper ${animatingTasks.has(task.id) ? 'animating' : ''}`}
                    >
                      <TaskCard
                        task={task}
                        onToggleCompletion={handleToggleCompletion}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Completed Container Card - Always Show */}
          <div className="container-card completed-container">
            <div className="container-header" onClick={() => toggleSectionCollapse('completed')}>
              <div className="container-header-left">
                <span className="container-emoji">✅</span>
                <h3 className="container-title">Completed ({sections.completed.length})</h3>
              </div>
              <button className="collapse-toggle" type="button">
                {collapsedSections.completed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!collapsedSections.completed && sections.completed.length > 0 && (
              <div className="container-content">
                <div className="tasks-grid-inside-container">
                  {sections.completed.map((task) => (
                    <div
                      key={task.id}
                      className={`task-card-wrapper ${animatingTasks.has(task.id) ? 'animating' : ''}`}
                    >
                      <TaskCard
                        task={task}
                        onToggleCompletion={handleToggleCompletion}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        showActions={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={onAddTask}
        onUpdate={onUpdateTask}
        editingTask={editingTask}
      />

      {/* Custom Styles */}
      <style jsx>{`
        /* Card Container Sections Layout */
        .card-container-sections {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0;
        }

        /* Container Cards - Consistent Neutral Styling */
        .container-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .container-card:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
        }

        /* All containers use same neutral background */
        .pending-container,
        .overdue-container,
        .completed-container {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        /* Enhanced Container Headers with Collapse/Expand */
        .container-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .container-header:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .container-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .container-emoji {
          font-size: 16px;
          line-height: 1;
        }

        .container-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1;
        }

        .collapse-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .collapse-toggle:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        /* Container Content - Proper Padding */
        .container-content {
          padding: 20px;
        }

        /* Task Grid Inside Containers */
        .tasks-grid-inside-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        /* Task Card Wrappers - Maintain Existing Animations */
        .task-card-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
          position: relative;
        }

        .task-card-wrapper.animating {
          transform: scale(0.95);
          opacity: 0.7;
          filter: blur(1px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .card-container-sections {
            gap: 16px;
          }

          .container-header {
            padding: 14px 16px;
          }

          .container-title {
            font-size: 15px;
          }

          .container-emoji {
            font-size: 15px;
          }

          .container-content {
            padding: 16px;
          }

          .tasks-grid-inside-container {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .collapse-toggle {
            width: 28px;
            height: 28px;
          }
        }

        @media (min-width: 1400px) {
          .tasks-grid-inside-container {
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 28px;
          }

          .container-header {
            padding: 18px 24px;
          }

          .container-content {
            padding: 24px;
          }
        }

        /* Smooth Animations */
        .container-card {
          animation: container-fade-in 0.4s ease-out;
        }

        .tasks-grid-inside-container {
          animation: content-fade-in 0.5s ease-out 0.1s both;
        }

        @keyframes container-fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes content-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Subtle Hover Effects for Container Cards */
        .container-card:hover .container-header {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Visual Hierarchy - Task Cards Remain Prominent */
        .container-card .task-card {
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .container-card .task-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        /* Ensure Proper Visual Nesting */
        .container-card {
          position: relative;
          z-index: 1;
        }

        .container-card .task-card {
          position: relative;
          z-index: 2;
        }

        /* Completed Section Subtle Styling */
        .completed-container {
          opacity: 0.95;
        }

        .completed-container .task-card {
          opacity: 0.9;
        }

        .completed-container .task-card:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};