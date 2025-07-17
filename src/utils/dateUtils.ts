import { Habit } from '../types/habit';

export const formatDate = (date: Date): string => {
  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = (): string => {
  // Get today's date in local timezone
  const today = new Date();
  return formatDate(today);
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Start week on Monday
  return new Date(d.setDate(diff));
};

export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

export const isToday = (dateString: string): boolean => {
  return dateString === getTodayString();
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// OPTIMISTIC completion rate calculation - don't penalize for incomplete today
export const getCompletionRate = (habit: Habit, period: 'week' | 'month' | number): number => {
  const today = new Date();
  const todayString = getTodayString();
  
  let startDate: Date;
  
  if (period === 'week') {
    startDate = getWeekStart(today);
  } else if (period === 'month') {
    startDate = getMonthStart(today);
  } else {
    // Legacy support for number of days
    startDate = new Date(today.getTime() - (period - 1) * 24 * 60 * 60 * 1000);
  }
  
  // Parse habit creation date properly
  const habitCreatedDate = new Date(habit.createdDate + 'T00:00:00');
  const habitCreatedString = formatDate(habitCreatedDate);
  
  // Only count days from habit creation date or period start, whichever is later
  const effectiveStartDate = habitCreatedDate > startDate ? habitCreatedDate : startDate;
  const effectiveStartString = formatDate(effectiveStartDate);
  
  // OPTIMISTIC FIX: Get elapsed days but exclude today unless it's completed
  const isTodayCompleted = habit.completions.includes(todayString);
  
  // If today is completed, include it. Otherwise, only include days up to yesterday
  const endDate = isTodayCompleted ? today : new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const allElapsedDays = getDateRange(effectiveStartDate, endDate);
  
  // DEBUG: Log the calculation details
  console.log(`=== OPTIMISTIC COMPLETION RATE DEBUG for ${habit.name} ===`);
  console.log('Period:', period);
  console.log('Today:', todayString);
  console.log('Today completed:', isTodayCompleted);
  console.log('Habit created:', habit.createdDate);
  console.log('Habit created parsed:', habitCreatedString);
  console.log('Period start date:', formatDate(startDate));
  console.log('Effective start date:', effectiveStartString);
  console.log('End date for calculation:', formatDate(endDate));
  console.log('All elapsed days:', allElapsedDays);
  console.log('Habit selected days:', habit.selectedDays);
  console.log('Habit completions:', habit.completions);
  
  // Filter to only include days when the habit was scheduled
  const scheduledElapsedDays = allElapsedDays.filter(dateString => {
    const date = new Date(dateString + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // If habit has no selectedDays (legacy) or is empty, assume daily
    if (!habit.selectedDays || habit.selectedDays.length === 0) {
      console.log(`Day ${dateString} (${dayName}): INCLUDED (daily habit)`);
      return true; // Daily habit
    }
    
    // Only count days when the habit was scheduled
    const isScheduled = habit.selectedDays.includes(dayName);
    console.log(`Day ${dateString} (${dayName}): ${isScheduled ? 'INCLUDED' : 'EXCLUDED'} (scheduled: ${habit.selectedDays.join(', ')})`);
    return isScheduled;
  });
  
  console.log('Scheduled elapsed days:', scheduledElapsedDays);
  
  if (scheduledElapsedDays.length === 0) {
    console.log('No scheduled elapsed days, returning 0%');
    return 0;
  }
  
  // Count completions only on scheduled elapsed days
  const completedDays = habit.completions.filter(completion => 
    scheduledElapsedDays.includes(completion)
  ).length;
  
  console.log('Completed days in period:', completedDays);
  console.log('Total scheduled days in period:', scheduledElapsedDays.length);
  
  // CRITICAL FIX: Handle edge case for new habits
  if (scheduledElapsedDays.length === 1 && scheduledElapsedDays[0] === todayString && completedDays === 1) {
    console.log('NEW HABIT COMPLETED TODAY: Returning 100%');
    return 100;
  }
  
  // Calculate percentage based on scheduled days only (optimistic approach)
  const percentage = scheduledElapsedDays.length > 0 ? Math.round((completedDays / scheduledElapsedDays.length) * 100) : 0;
  console.log('Final optimistic percentage:', percentage);
  console.log('=== END DEBUG ===');
  
  return percentage;
};

export const getElapsedDaysInWeek = (): number => {
  const today = new Date();
  const weekStart = getWeekStart(today);
  return getDateRange(weekStart, today).length;
};

export const getElapsedDaysInMonth = (): number => {
  const today = new Date();
  const monthStart = getMonthStart(today);
  return getDateRange(monthStart, today).length;
};

// Calendar utilities
export const getCalendarDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const startDate = getWeekStart(firstDay);
  
  const days: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Generate 6 weeks worth of days to ensure full calendar
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth();
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return formatDate(date1) === formatDate(date2);
};

export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};