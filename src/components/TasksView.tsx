import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { AddTaskModal } from './AddTaskModal';
import { Task } from '../types/task';
import { getTodayString } from '../utils/dateUtils';

const isTaskEffectivelyCompleted = (task: Task): boolean => {
  if (task.status === 'completed') return true;
  if (task.type === 'event') {
    const now = new Date();
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    const eventTime = task.endTime || task.dueTime;
    const [hours, minutes] = eventTime.split(':').map(Number);
    const eventEndTime = new Date(eventDate);
    eventEndTime.setHours(hours, minutes, 0, 0);
    return now > eventEndTime;
  }
  return false;
};

interface TasksViewProps {
  tasks: Task[];
  selectedCategory: string;
  selectedPriority: string;
  selectedStatus: string;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleCompletion: (id: string) => void;
}

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
  
  const handleAddTask = (taskData: Omit<Task, "id" | "createdDate">): void => {
    // Add the missing createdDate field
    const taskWithCreatedDate: Omit<Task, "id"> = {
      ...taskData,
      createdDate: new Date().toISOString().split('T')[0] // Today's date
    };
    
    // Pass to the actual onAddTask function
    onAddTask(taskWithCreatedDate);
  };

  // Section collapse/expand state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    pending: false,
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

  // Updated task counts - use the new structure
  const getTaskCounts = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => isTaskEffectivelyCompleted(t)).length;
    const pending = tasks.filter(t => !isTaskEffectivelyCompleted(t)).length;
    
    return { total, completed, pending };
  };

  const counts = getTaskCounts();

  // Updated organize tasks by sections with overdue separation
  const organizeTasksBySections = () => {
    const pendingTasks = filteredTasks.filter(task => 
      !isTaskEffectivelyCompleted(task)
    );
    
    // Separate pending tasks into current and overdue
    const today = getTodayString();
    const currentTasks = pendingTasks.filter(task => 
      task.status !== 'overdue' && task.dueDate >= today
    );
    const overdueTasks = pendingTasks.filter(task => 
      task.status === 'overdue' || (task.status !== 'completed' && task.dueDate < today)
    );
    
    const completedTasks = filteredTasks.filter(task => 
      isTaskEffectivelyCompleted(task)
    );

    return {
      current: currentTasks,
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
          <h1 className="text-2xl font-bold text-gray-800">Tasks & Events</h1>
          <p className="text-gray-600">Manage your deadlines, to-dos, and schedule</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Task or Event
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
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
                <h3 className="container-title">Pending ({sections.current.length + sections.overdue.length})</h3>
              </div>
              <button className="collapse-toggle" type="button">
                {collapsedSections.pending ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!collapsedSections.pending && (sections.current.length > 0 || sections.overdue.length > 0) && (
              <div className="container-content">
                <div className="tasks-grid-inside-container">
                  {/* Current/Future Tasks */}
                  {sections.current.map((task) => (
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
                  
                  {/* Splitter - only show if we have both current and overdue tasks */}
                  {sections.current.length > 0 && sections.overdue.length > 0 && (
                    <div className="section-splitter">
                      <div className="splitter-line"></div>
                      <span className="splitter-text">Overdue</span>
                      <div className="splitter-line"></div>
                    </div>
                  )}
                  
                  {/* Overdue Tasks */}
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
        onAdd={handleAddTask}
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
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 16px;
          width: 100%;
        }

        /* Task Card Wrapper for Animation */
        .task-card-wrapper {
          transition: all 0.3s ease;
        }

        .task-card-wrapper.animating {
          opacity: 0.7;
          transform: scale(0.98);
        }

        /* Animation and Smooth Transitions */
        .container-card {
          animation: container-fade-in 0.5s ease-out;
        }

        .container-content {
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

        /* Section Splitter Styling */
        .section-splitter {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          margin: 24px 0;
          gap: 16px;
        }

        .splitter-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #f87171 20%, #f87171 80%, transparent);
        }

        .splitter-text {
          font-size: 14px;
          font-weight: 600;
          color: #dc2626;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          padding: 0 8px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .tasks-grid-inside-container {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .container-content {
            padding: 16px;
          }

          .container-header {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
};