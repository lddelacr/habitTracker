import { useState, useCallback, useEffect } from 'react';
import { Task, TaskStats } from '../types/task';
import { getTodayString } from '../utils/dateUtils';
import { Database } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryColor, migrateCategoryName } from '../utils/categoryUtils';

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
      dueDate: taskRow.due_date,
      dueTime: taskRow.due_time || '09:00',
      status: taskRow.status as 'pending' | 'completed' | 'overdue',
      createdDate: taskRow.created_date
    };

    // Determine if this task uses a custom color
    const categoryColor = getCategoryColor(categoryId);
    if (taskRow.color !== categoryColor) {
      task.customColor = taskRow.color;
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
      // Do NOT update status during regular operations
      const today = getTodayString(); 
      const updatedTasks = await Promise.all(convertedTasks.map(async (task) => {
        // Only update status if it's clearly wrong (not during category updates)
        let needsStatusUpdate = false;
        let newStatus = task.status;
        
        // Only auto-update to overdue if task is pending and past due
        if (task.status === 'pending' && task.dueDate < today) {
          needsStatusUpdate = true;
          newStatus = 'overdue';
        }
        
        if (needsStatusUpdate) {
          try {
            await supabase
              .from('tasks')
              .update({ status: newStatus })
              .eq('id', task.id)
              .eq('user_id', user.id);
            return { ...task, status: newStatus as const };
          } catch (error) {
            console.error('Failed to update task status:', error);
          }
        }
        return task;
      }));

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user, convertToTask]);

  // Load tasks when user changes
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdDate'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          name: taskData.name,
          description: taskData.description,
          category: taskData.category,
          color: taskData.color,
          due_date: taskData.dueDate,
          due_time: taskData.dueTime,
          priority: 'medium', // Default value for database
          status: taskData.status,
          created_date: getTodayString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newTask = convertToTask(data);
      // Preserve custom color if provided
      if (taskData.customColor) {
        newTask.customColor = taskData.customColor;
      }
      setTasks(prev => [newTask, ...prev]);
    } catch (error) {
      console.error('Failed to add task:', error);
      setError(error instanceof Error ? error.message : 'Failed to add task');
      throw error;
    }
  }, [user, convertToTask]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('=== TASK UPDATE DEBUG ===');
    console.log('Task ID:', id);
    console.log('Updates received:', updates);

    try {
      // Build update object with only the fields that are being updated
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
      if (updates.dueTime !== undefined) updateData.due_time = updates.dueTime;
      if (updates.status !== undefined) updateData.status = updates.status;
      
      // Always update the timestamp
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('=== DATABASE UPDATE ERROR ===');
        console.error('Error:', error);
        console.error('Update data that failed:', updateData);
        throw error;
      }
      

      // Update local state
      setTasks(prev => prev.map(task => {
        if (task.id === id) {
          const updatedTask = { ...task, ...updates };
          
          // Update color based on custom color or category
          if (updates.customColor !== undefined) {
            updatedTask.color = updates.customColor || getCategoryColor(updatedTask.category);
            updatedTask.customColor = updates.customColor;
          } else if (updates.category) {
            // If only category changed, update color to match new category
            if (!task.customColor) {
              updatedTask.color = getCategoryColor(updates.category);
            }
          }
          
          return updatedTask;
        }
        return task;
      }));
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
      throw error;
    }
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Optimistic update - remove from UI immediately
      setTasks(prev => prev.filter(task => task.id !== id));

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database delete failed, reverting optimistic update:', error);
        // Revert optimistic update on error
        await loadTasks();
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete task');
      throw error;
    }
  }, [user, loadTasks]);

  const toggleTaskCompletion = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // Determine the correct new status
    let newStatus: 'pending' | 'completed' | 'overdue';
    if (task.status === 'completed') {
      // When uncompleting, check if it should be overdue
      const today = getTodayString();
      newStatus = task.dueDate < today ? 'overdue' : 'pending';
    } else {
      // When completing, always set to completed
      newStatus = 'completed';
    }

    try {
      // Optimistic update - update UI immediately like habits do
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, status: newStatus } : t
      ));

      // Update database in background
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database update failed, reverting optimistic update:', error);
        // Revert optimistic update on error
        await loadTasks();
        throw error;
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
    }
  }, [user, tasks, loadTasks]);

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