import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStats } from '../types/task';
import { getTodayString } from '../utils/dateUtils';
import { Database } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryColor } from '../utils/categoryUtils';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Convert database rows to Task objects
  const convertToTask = useCallback((taskRow: TaskRow): Task => {
    // Use the category as stored in database - no migration needed here
    const categoryId = taskRow.category;
    
    const task: Task = {
      id: taskRow.id,
      name: taskRow.name,
      description: taskRow.description || '',
      category: categoryId,
      color: taskRow.color,
      customColor: null,
      
      // NEW: Handle type field (default to 'task' for existing data)
      type: (taskRow.type as 'task' | 'event') || 'task',
      
      dueDate: taskRow.due_date,
      dueTime: taskRow.due_time || '09:00',
      
      // NEW: Handle event-specific fields
      endTime: taskRow.end_time || undefined,
      location: taskRow.location || undefined,
      attendees: taskRow.attendees ? (() => {
        try {
          const parsed = JSON.parse(taskRow.attendees);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      })() : undefined,
      
      status: taskRow.status as 'pending' | 'completed' | 'overdue',
      createdDate: taskRow.created_date
    };

    // Determine if this task uses a custom color
    const categoryColor = getCategoryColor(categoryId);
    if (taskRow.color !== categoryColor) {
      task.customColor = taskRow.color;
    }
    
    // NEW: Handle custom_color field from database
    if (taskRow.custom_color) {
      task.customColor = taskRow.custom_color;
      task.color = taskRow.custom_color;
    }

    return task;
  }, []);

  // Load tasks from Supabase
  const loadTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksError) {
        throw tasksError;
      }

      const convertedTasks = (tasksData || []).map(convertToTask);
      
      // CRITICAL: Only update overdue status during initial load
      // Don't modify status for tasks that are completed
      const today = getTodayString();
      const tasksWithUpdatedStatus = convertedTasks.map(task => {
        if (task.status !== 'completed' && task.dueDate < today) {
          return { ...task, status: 'overdue' as const };
        }
        return task;
      });

      setTasks(tasksWithUpdatedStatus);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user, convertToTask]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdDate'>) => {
    if (!user) return;

    try {
      const newTaskRow = {
        user_id: user.id,
        name: taskData.name,
        description: taskData.description,
        category: taskData.category,
        color: taskData.color,
        due_date: taskData.dueDate,
        due_time: taskData.dueTime,
        status: taskData.status,
        created_date: getTodayString(),
        
        // NEW: Handle new fields
        type: taskData.type || 'task',
        end_time: taskData.endTime || null,
        location: taskData.location || null,
        attendees: taskData.attendees || null,
        custom_color: taskData.customColor || null,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTaskRow])
        .select()
        .single();

      if (error) throw error;

      const newTask = convertToTask(data);
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err instanceof Error ? err.message : 'Failed to add task');
    }
  }, [user, convertToTask]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) return;

    try {
      // Convert Task updates to database format
      const updateData: Record<string, string | null> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.dueTime !== undefined) updateData.due_time = updates.dueTime;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      // NEW: Handle new fields in updates
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.attendees !== undefined) {
        updateData.attendees = updates.attendees ? JSON.stringify(updates.attendees) : null;
      }
      if (updates.customColor !== undefined) updateData.custom_color = updates.customColor;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = convertToTask(data);
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [user, convertToTask]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  }, [user]);

  const toggleTaskCompletion = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedTask = convertToTask(data);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  }, [user, tasks, convertToTask]);

  const getFilteredTasks = useCallback(() => {
    return tasks.filter(task => {
      const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory;
      const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
      
      return categoryMatch && statusMatch;
    });
  }, [tasks, selectedCategory, selectedStatus]);

  const getTodayTasks = useCallback(() => {
    const today = getTodayString();
    return tasks.filter(task => task.dueDate === today);
  }, [tasks]);

  const getTaskStats = useCallback((): TaskStats => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const tasksByCategory = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingTasks,
      completionRate,
      tasksByCategory
    };
  }, [tasks]);

  return {
    tasks,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    getFilteredTasks,
    getTodayTasks,
    getTaskStats,
    isLoading,
    error,
    clearError: () => setError(null),
    refreshTasks: loadTasks
  };
};