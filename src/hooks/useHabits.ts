import { useState, useCallback, useEffect } from 'react';
import { Habit, HabitStats, HabitNote, DailyThoughts } from '../types/habit';
import { getTodayString, getCompletionRate } from '../utils/dateUtils';
import { updateHabitStreaks, isCompletedToday } from '../utils/habitUtils';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryColor, migrateCategoryName } from '../utils/categoryUtils';
import { cleanupInvalidCompletions, validateHabitData } from '../utils/dataCleanup';

type HabitRow = Database['public']['Tables']['habits']['Row'];

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [habitNotes, setHabitNotes] = useState<Record<string, HabitNote>>({});
  const [dailyThoughts, setDailyThoughts] = useState<Record<string, DailyThoughts>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, HabitNote>>({});
  
  const { user } = useAuth();

  // Debug function to check database schema
  // Convert database rows to Habit objects
  const convertToHabit = useCallback((habitRow: HabitRow, completions: string[]): Habit => {
    // Handle migration from old targetFrequency to selectedDays
    let selectedDays: string[];
    if (habitRow.selected_days) {
      try {
        selectedDays = JSON.parse(habitRow.selected_days);
      } catch {
        selectedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      }
    } else {
      // Fallback for old habits with target_frequency
      selectedDays = habitRow.target_frequency === 'daily' 
        ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        : ['monday', 'wednesday', 'friday'];
    }
    
    // Use the category as stored in database - no migration needed here
    const categoryId = habitRow.category;
    
    const habit: Habit = {
      id: habitRow.id,
      name: habitRow.name,
      description: habitRow.description || '',
      category: categoryId,
      color: habitRow.color, // This will be the current effective color
      customColor: null, // Will be set below if needed
      selectedDays,
      createdDate: habitRow.created_date,
      completions,
      currentStreak: 0,
      bestStreak: 0
    };

    // Determine if this habit uses a custom color
    const categoryColor = getCategoryColor(categoryId);
    if (habitRow.color !== categoryColor) {
      habit.customColor = habitRow.color;
    }

    return updateHabitStreaks(habit);
  }, []);

  // Load habits from Supabase
  const loadHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);

      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (habitsError) {
        throw habitsError;
      }

      // Fetch completions
      const { data: completionsData, error: completionsError } = await supabase
        .from('completions')
        .select('*')
        .eq('user_id', user.id);

      if (completionsError) {
        throw completionsError;
      }

      // Group completions by habit_id
      const completionsByHabit = (completionsData || []).reduce((acc, completion) => {
        if (!acc[completion.habit_id]) {
          acc[completion.habit_id] = [];
        }
        acc[completion.habit_id].push(completion.completion_date);
        return acc;
      }, {} as Record<string, string[]>);

      // Convert to Habit objects
      const habitsWithCompletions = (habitsData || []).map(habitRow => 
        convertToHabit(habitRow, completionsByHabit[habitRow.id] || [])
      );

      setHabits(habitsWithCompletions);
    } catch (error) {
      console.error('Failed to load habits:', error);
      setError(error instanceof Error ? error.message : 'Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  }, [user, convertToHabit]);

  // Load habits when user changes
  useEffect(() => {
    loadHabits();
    
    // Run data cleanup on first load (only in development)
    if (user && process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        try {
          await validateHabitData(user.id);
          const cleaned = await cleanupInvalidCompletions(user.id);
          if (cleaned && cleaned > 0) {
            console.log(`Cleaned up ${cleaned} invalid completion records. Reloading habits...`);
            loadHabits(); // Reload after cleanup
          }
        } catch (error) {
          console.error('Data cleanup failed:', error);
        }
      }, 2000); // Wait 2 seconds after initial load
    }
  }, [loadHabits, user]);

  // Migrate localStorage data on first login
  const migrateLocalStorageData = useCallback(async () => {
    if (!user) return;

    try {
      const localHabits = localStorage.getItem('habits');
      if (localHabits && habits.length === 0) {
        const parsedHabits = JSON.parse(localHabits);
        
        if (parsedHabits.length > 0) {
          const shouldMigrate = window.confirm(
            `We found ${parsedHabits.length} habits from your previous session. Would you like to import them to your account?`
          );
          
          if (shouldMigrate) {
            for (const habit of parsedHabits) {
              try {
                // Migrate category if needed
                const categoryId = migrateCategoryName(habit.category || 'Other');
                
                // Determine color
                const categoryColor = getCategoryColor(categoryId);
                const finalColor = habit.color || categoryColor;
                
                // Create habit
                const { data: newHabit, error: habitError } = await supabase
                  .from('habits')
                  .insert({
                    user_id: user.id,
                    name: habit.name,
                    description: habit.description || '',
                    category: categoryId,
                    color: finalColor,
                    target_frequency: habit.targetFrequency || 'daily',
                    selected_days: JSON.stringify(habit.selectedDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
                    created_date: habit.createdDate || getTodayString()
                  })
                  .select()
                  .single();

                if (habitError) {
                  console.error('Failed to migrate habit:', habitError);
                  continue;
                }

                // Add completions
                if (habit.completions && habit.completions.length > 0 && newHabit) {
                  const completionsToInsert = habit.completions.map((completionDate: string) => ({
                    user_id: user.id,
                    habit_id: newHabit.id,
                    completion_date: completionDate
                  }));

                  const { error: completionsError } = await supabase
                    .from('completions')
                    .insert(completionsToInsert);

                  if (completionsError) {
                    console.error('Failed to migrate completions:', completionsError);
                  }
                }
              } catch (error) {
                console.error('Failed to migrate habit:', error);
              }
            }
            
            // Reload habits after migration
            await loadHabits();
            
            // Clear localStorage after successful migration
            localStorage.removeItem('habits');
            alert('Your habits have been successfully imported to your account!');
          }
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
    }
  }, [user, habits.length, loadHabits]);

  // Run migration check when user logs in and habits are loaded
  useEffect(() => {
    if (user && !isLoading) {
      migrateLocalStorageData();
    }
  }, [user, isLoading, migrateLocalStorageData]);

  const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'completions' | 'currentStreak' | 'bestStreak' | 'createdDate'> & { color: string; selectedDays: string[]; customColor?: string | null }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const finalColor = habitData.color;
      
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: habitData.name,
          description: habitData.description,
          category: habitData.category,
          color: finalColor,
          selected_days: JSON.stringify(habitData.selectedDays),
          created_date: getTodayString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newHabit = convertToHabit(data, []);
      // Set custom color if provided
      if (habitData.customColor) {
        newHabit.customColor = habitData.customColor;
      }
      setHabits(prev => [newHabit, ...prev]);
    } catch (error) {
      console.error('Failed to add habit:', error);
      setError(error instanceof Error ? error.message : 'Failed to add habit');
      throw error;
    }
  }, [user, convertToHabit]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    if (!user) throw new Error('User not authenticated');

    console.log('=== HABIT UPDATE DEBUG ===');
    console.log('Habit ID:', id);
    console.log('Updates received:', updates);
    
    try {
      const updateData: Record<string, string> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.selectedDays !== undefined) updateData.selected_days = JSON.stringify(updates.selectedDays);
      
      // Always update the timestamp
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('habits')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('=== DATABASE UPDATE ERROR ===');
        console.error('Error:', error);
        console.error('Update data that failed:', updateData);
        throw error;
      }
      
      console.log('Database update successful');

      setHabits(prev => prev.map(habit => {
        if (habit.id === id) {
          // Properly merge updates while preserving existing values
          const updatedHabit = { ...habit, ...updates };
          
          // Update color based on custom color or category
          if (updates.customColor !== undefined) {
            updatedHabit.color = updates.customColor || getCategoryColor(updatedHabit.category);
            updatedHabit.customColor = updates.customColor;
          } else if (updates.category) {
            // If only category changed, update color to match new category
            if (!habit.customColor) {
              updatedHabit.color = getCategoryColor(updates.category);
            }
          }
          
          return updateHabitStreaks(updatedHabit);
        }
        return habit;
      }));
    } catch (error) {
      console.error('Failed to update habit:', error);
      setError(error instanceof Error ? error.message : 'Failed to update habit');
      throw error;
    }
  }, [user]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setHabits(prev => prev.filter(habit => habit.id !== id));
    } catch (error) {
      console.error('Failed to delete habit:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete habit');
      throw error;
    }
  }, [user]);

  const toggleHabitCompletion = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const today = getTodayString();
    const habit = habits.find(h => h.id === id);
    
    if (!habit) return;
    
    const isCompleted = habit.completions.includes(today);
    
    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('user_id', user.id)
          .eq('habit_id', id)
          .eq('completion_date', today);

        if (error) {
          throw error;
        }
      } else {
        // Add completion
        const { error } = await supabase
          .from('completions')
          .insert({
            user_id: user.id,
            habit_id: id,
            completion_date: today
          });

        if (error) {
          throw error;
        }
      }
      
      setHabits(prev => prev.map(h => {
        if (h.id !== id) return h;
        
        const newCompletions = isCompleted
          ? h.completions.filter(date => date !== today)
          : [...h.completions, today];
        
        return updateHabitStreaks({
          ...h,
          completions: newCompletions
        });
      }));
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
      setError(error instanceof Error ? error.message : 'Failed to update habit');
    }
  }, [user, habits]);

  const toggleHabitCompletionForDate = useCallback(async (id: string, date: string) => {
    if (!user) throw new Error('User not authenticated');

    const habit = habits.find(h => h.id === id);
    
    if (!habit) return;
    
    // CRITICAL: Prevent completion before habit creation date
    if (date < habit.createdDate) {
      console.warn(`Cannot complete habit "${habit.name}" on ${date} - habit was created on ${habit.createdDate}`);
      return;
    }
    
    const isCompleted = habit.completions.includes(date);
    
    try {
      if (isCompleted) {
        // Remove completion
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('user_id', user.id)
          .eq('habit_id', id)
          .eq('completion_date', date);

        if (error) {
          throw error;
        }
      } else {
        // Add completion
        const { error } = await supabase
          .from('completions')
          .insert({
            user_id: user.id,
            habit_id: id,
            completion_date: date
          });

        if (error) {
          throw error;
        }
      }
      
      setHabits(prev => prev.map(h => {
        if (h.id !== id) return h;
        
        const newCompletions = isCompleted
          ? h.completions.filter(completionDate => completionDate !== date)
          : [...h.completions, date];
        
        return updateHabitStreaks({
          ...h,
          completions: newCompletions
        });
      }));
      
      // Force a small delay to ensure state updates are processed
      setTimeout(() => {
        // Trigger a custom event that the calendar can listen to
        window.dispatchEvent(new CustomEvent('habitCompletionChanged', { 
          detail: { habitId: id, date, isCompleted: !isCompleted } 
        }));
      }, 50);
    } catch (error) {
      console.error('Failed to toggle habit completion for date:', error);
      setError(error instanceof Error ? error.message : 'Failed to update habit');
    }
  }, [user, habits]);

  const getFilteredHabits = useCallback(() => {
    if (selectedCategory === 'all') {
      return habits;
    }
    return habits.filter(habit => habit.category === selectedCategory);
  }, [habits, selectedCategory]);

  const getTodayHabits = useCallback(() => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    
    return habits
      .filter(habit => {
        // If habit has no selectedDays or empty selectedDays array, treat as daily (show every day)
        if (!habit.selectedDays || habit.selectedDays.length === 0) {
          return true;
        }
        
        // Only show habits that are scheduled for today
        return habit.selectedDays.includes(todayName);
      })
      .map(habit => ({
        ...habit,
        isCompletedToday: isCompletedToday(habit)
      }));
  }, [habits]);

  const getHabitStats = useCallback((): HabitStats => {
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((sum, habit) => sum + habit.completions.length, 0);
    const averageCompletionRate = totalHabits > 0 
      ? Math.round(habits.reduce((sum, habit) => sum + getCompletionRate(habit, 'month'), 0) / totalHabits)
      : 0;
    const longestStreak = Math.max(...habits.map(h => h.bestStreak), 0);
    const currentActiveStreaks = habits.filter(h => h.currentStreak > 0).length;

    return {
      totalHabits,
      totalCompletions,
      averageCompletionRate,
      longestStreak,
      currentActiveStreaks
    };
  }, [habits]);

  // Notes functionality
  const saveHabitNote = useCallback(async (habitId: string, date: string, note: string) => {
    const noteKey = `${habitId}-${date}`;
    const noteData: HabitNote = {
      habitId,
      date,
      note,
      timestamp: new Date().toISOString()
    };

    setHabitNotes(prev => ({
      ...prev,
      [noteKey]: noteData
    }));

    // Save to localStorage for persistence
    localStorage.setItem(`habit-note-${noteKey}`, JSON.stringify(noteData));
  }, []);

  const getHabitNote = useCallback((habitId: string, date: string): string => {
    const noteKey = `${habitId}-${date}`;
    return habitNotes[noteKey]?.note || '';
  }, [habitNotes]);

  const saveDailyThoughts = useCallback(async (date: string, thoughts: string) => {
    const thoughtsData: DailyThoughts = {
      date,
      thoughts,
      timestamp: new Date().toISOString()
    };

    setDailyThoughts(prev => ({
      ...prev,
      [date]: thoughtsData
    }));

    // Save to localStorage for persistence
    localStorage.setItem(`daily-thoughts-${date}`, JSON.stringify(thoughtsData));
  }, []);

  const getDailyThoughts = useCallback((date: string): string => {
    return dailyThoughts[date]?.thoughts || '';
  }, [dailyThoughts]);

  // Task notes functionality
  const saveTaskNote = useCallback(async (taskId: string, date: string, note: string) => {
    const noteKey = `${taskId}-${date}`;
    const noteData: HabitNote = {
      habitId: taskId, // Reuse the same structure
      date,
      note,
      timestamp: new Date().toISOString()
    };

    setTaskNotes(prev => ({
      ...prev,
      [noteKey]: noteData
    }));

    // Save to localStorage for persistence
    localStorage.setItem(`task-note-${noteKey}`, JSON.stringify(noteData));
  }, []);

  const getTaskNote = useCallback((taskId: string, date: string): string => {
    const noteKey = `${taskId}-${date}`;
    return taskNotes[noteKey]?.note || '';
  }, [taskNotes]);
  // Load notes from localStorage on mount
  useEffect(() => {
    const loadStoredNotes = () => {
      const notes: Record<string, HabitNote> = {};
      const thoughts: Record<string, DailyThoughts> = {};
      const taskNotesData: Record<string, HabitNote> = {};

      // Load habit notes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('habit-note-')) {
          try {
            const noteData = JSON.parse(localStorage.getItem(key) || '');
            const noteKey = `${noteData.habitId}-${noteData.date}`;
            notes[noteKey] = noteData;
          } catch (error) {
            console.error('Error loading habit note:', error);
          }
        } else if (key?.startsWith('task-note-')) {
          try {
            const noteData = JSON.parse(localStorage.getItem(key) || '');
            const noteKey = `${noteData.habitId}-${noteData.date}`;
            taskNotesData[noteKey] = noteData;
          } catch (error) {
            console.error('Error loading task note:', error);
          }
        } else if (key?.startsWith('daily-thoughts-')) {
          try {
            const thoughtsData = JSON.parse(localStorage.getItem(key) || '');
            thoughts[thoughtsData.date] = thoughtsData;
          } catch (error) {
            console.error('Error loading daily thoughts:', error);
          }
        }
      }

      setHabitNotes(notes);
      setDailyThoughts(thoughts);
      setTaskNotes(taskNotesData);
    };

    loadStoredNotes();
  }, []);

  return {
    habits,
    selectedCategory,
    setSelectedCategory,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    toggleHabitCompletionForDate,
    getFilteredHabits,
    getTodayHabits,
    getHabitStats,
    saveHabitNote,
    getHabitNote,
    saveTaskNote,
    getTaskNote,
    saveDailyThoughts,
    getDailyThoughts,
    isLoading,
    error,
    clearError: () => setError(null),
    refreshHabits: loadHabits
  };
};