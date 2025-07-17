import { Habit } from '../types/habit';
import { getTodayString, formatDate } from './dateUtils';

export const calculateStreak = (completions: string[], selectedDays?: string[], targetDate?: string): number => {
  if (completions.length === 0) return 0;
  
  const sortedCompletions = [...completions].sort((a, b) => b.localeCompare(a));
  const today = targetDate || getTodayString();
  
  // If no selectedDays or empty array, treat as daily habit (original logic)
  if (!selectedDays || selectedDays.length === 0) {
    let streak = 0;
    // TIMEZONE FIX: Parse date in local timezone consistently
    const currentDate = new Date(today + 'T00:00:00');
    
    // OPTIMISTIC FIX: Start from today if completed, otherwise start from yesterday
    const isTodayCompleted = sortedCompletions.includes(today);
    if (isTodayCompleted) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Don't penalize for today not being complete yet - start from yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count backwards from yesterday (or today if completed)
    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = sortedCompletions[i];
      const expectedDate = formatDate(currentDate);
      
      if (completionDate === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }
  
  // For scheduled habits, only count scheduled days
  let streak = 0;
  // TIMEZONE FIX: Parse date in local timezone consistently
  const currentDate = new Date(today + 'T00:00:00');
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Check if today is a scheduled day and if it's completed
  const todayDayName = dayNames[currentDate.getDay()];
  const isTodayScheduled = selectedDays.includes(todayDayName);
  const isTodayCompleted = sortedCompletions.includes(today);
  
  // OPTIMISTIC FIX: Don't break streak for incomplete today
  // If today is scheduled and completed, start counting from today
  if (isTodayScheduled && isTodayCompleted) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    // If today is not completed (or not scheduled), start from yesterday
    // Don't penalize for today not being done yet
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  // Go backwards through scheduled days only
  while (true) {
    const currentDateString = formatDate(currentDate);
    const currentDayName = dayNames[currentDate.getDay()];
    
    // Only check days that are scheduled
    if (selectedDays.includes(currentDayName)) {
      // If this scheduled day is completed, continue streak
      if (sortedCompletions.includes(currentDateString)) {
        streak++;
      } else {
        // If this scheduled day is not completed, streak breaks
        break;
      }
    }
    // If day is not scheduled, skip it and continue checking
    
    currentDate.setDate(currentDate.getDate() - 1);
    
    // Safety check to prevent infinite loop (don't go back more than 365 days)
    if (currentDate < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
      break;
    }
  }
  
  return streak;
};

export const calculateBestStreak = (completions: string[], selectedDays?: string[]): number => {
  if (completions.length === 0) return 0;
  
  const sortedCompletions = [...completions].sort((a, b) => a.localeCompare(b));
  
  // If no selectedDays or empty array, treat as daily habit (original logic)
  if (!selectedDays || selectedDays.length === 0) {
    let bestStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;
    
    for (const completion of sortedCompletions) {
      // TIMEZONE FIX: Parse in local timezone
      const currentDate = new Date(completion + 'T00:00:00');
      
      if (previousDate === null) {
        currentStreak = 1;
      } else {
        const dayDifference = Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDifference === 1) {
          currentStreak++;
        } else {
          bestStreak = Math.max(bestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      previousDate = currentDate;
    }
    
    return Math.max(bestStreak, currentStreak);
  }
  
  // For scheduled habits, only count scheduled days
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  let bestStreak = 0;
  let currentStreak = 0;
  let lastScheduledDate: Date | null = null;
  
  for (const completion of sortedCompletions) {
    // TIMEZONE FIX: Parse in local timezone
    const currentDate = new Date(completion + 'T00:00:00');
    const currentDayName = dayNames[currentDate.getDay()];
    
    // Only count completions on scheduled days
    if (!selectedDays.includes(currentDayName)) {
      continue;
    }
    
    if (lastScheduledDate === null) {
      currentStreak = 1;
    } else {
      // Check if this is the next expected scheduled day
      const expectedDate = new Date(lastScheduledDate);
      expectedDate.setDate(expectedDate.getDate() + 1);
      
      // Find the next scheduled day after lastScheduledDate
      while (expectedDate <= currentDate) {
        const expectedDayName = dayNames[expectedDate.getDay()];
        if (selectedDays.includes(expectedDayName)) {
          break;
        }
        expectedDate.setDate(expectedDate.getDate() + 1);
      }
      
      if (formatDate(expectedDate) === completion) {
        currentStreak++;
      } else {
        // Gap in scheduled days, start new streak
        bestStreak = Math.max(bestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    lastScheduledDate = currentDate;
  }
  
  return Math.max(bestStreak, currentStreak);
};

export const isCompletedToday = (habit: Habit): boolean => {
  return habit.completions.includes(getTodayString());
};

export const updateHabitStreaks = (habit: Habit): Habit => {
  const currentStreak = calculateStreak(habit.completions, habit.selectedDays);
  const bestStreak = Math.max(calculateBestStreak(habit.completions, habit.selectedDays), currentStreak);
  
  return {
    ...habit,
    currentStreak,
    bestStreak
  };
};