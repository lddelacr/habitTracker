// Data cleanup utility to remove invalid completion data
import { supabase } from '../lib/supabase';

export const cleanupInvalidCompletions = async (userId: string) => {
  try {
    console.log('Starting data cleanup for invalid completions...');
    
    // Get all habits with their creation dates
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, created_date')
      .eq('user_id', userId);

    if (habitsError) {
      throw habitsError;
    }

    if (!habits || habits.length === 0) {
      console.log('No habits found for cleanup');
      return;
    }

    let totalCleaned = 0;

    // For each habit, remove completions that predate its creation
    for (const habit of habits) {
      const { data: invalidCompletions, error: selectError } = await supabase
        .from('completions')
        .select('id, completion_date')
        .eq('user_id', userId)
        .eq('habit_id', habit.id)
        .lt('completion_date', habit.created_date);

      if (selectError) {
        console.error(`Error finding invalid completions for habit ${habit.id}:`, selectError);
        continue;
      }

      if (invalidCompletions && invalidCompletions.length > 0) {
        console.log(`Found ${invalidCompletions.length} invalid completions for habit ${habit.id}`);
        
        // Delete invalid completions
        const { error: deleteError } = await supabase
          .from('completions')
          .delete()
          .eq('user_id', userId)
          .eq('habit_id', habit.id)
          .lt('completion_date', habit.created_date);

        if (deleteError) {
          console.error(`Error deleting invalid completions for habit ${habit.id}:`, deleteError);
        } else {
          totalCleaned += invalidCompletions.length;
          console.log(`Cleaned ${invalidCompletions.length} invalid completions for habit ${habit.id}`);
        }
      }
    }

    console.log(`Data cleanup completed. Removed ${totalCleaned} invalid completion records.`);
    return totalCleaned;
  } catch (error) {
    console.error('Error during data cleanup:', error);
    throw error;
  }
};

// Function to validate and log current data state
export const validateHabitData = async (userId: string) => {
  try {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, name, created_date')
      .eq('user_id', userId);

    if (habitsError) throw habitsError;

    const { data: completions, error: completionsError } = await supabase
      .from('completions')
      .select('habit_id, completion_date')
      .eq('user_id', userId);

    if (completionsError) throw completionsError;

    console.log('=== HABIT DATA VALIDATION ===');
    
    if (habits) {
      for (const habit of habits) {
        const habitCompletions = completions?.filter(c => c.habit_id === habit.id) || [];
        const invalidCompletions = habitCompletions.filter(c => c.completion_date < habit.created_date);
        
        console.log(`Habit: ${habit.name}`);
        console.log(`  Created: ${habit.created_date}`);
        console.log(`  Total completions: ${habitCompletions.length}`);
        console.log(`  Invalid completions: ${invalidCompletions.length}`);
        
        if (invalidCompletions.length > 0) {
          console.log(`  Invalid dates: ${invalidCompletions.map(c => c.completion_date).join(', ')}`);
        }
      }
    }
    
    console.log('=== END VALIDATION ===');
  } catch (error) {
    console.error('Error validating habit data:', error);
  }
};